const { Window, WebView } = require('bare-native')
const ws = require('bare-ws')
const http = require('bare-http1')
const Console = require('bare-console')
const Corestore = require('corestore')
const { Transform, Writable, pipeline } = require('streamx')
const { Zork } = require('zork-machine')
const { Coremachine, createMachine } = require('coremachine')
const Iambus = require('iambus')
const DHT = require('hyperdht')
const b4a = require('b4a')

const target = require('#target')
const html = require('./view.html')
const { cellery, menuApp, gameApp, menu } = require('./views/main')
const { Status } = require('./cells')

const console = new Console()

const token = require('bare-crypto').randomBytes(32).toString('hex')
const store = new Corestore(target.storage || 'zork')

// --- app state machine definition ---

const appConfig = createMachine({
  initial: 'MENU',
  context: {
    openSession: null,
    joinKey: null,
    sessions: []
  },
  states: {
    MENU: {
      on: {
        NEW_GAME: {
          target: 'PLAYING',
          action(ctx) {
            ctx.openSession = 'game-' + Date.now()
            ctx.sessions = [...ctx.sessions, ctx.openSession]
          }
        },
        CONTINUE: {
          target: 'PLAYING',
          action(ctx) {
            // @todo support choosing session
            ctx.openSession = ctx.sessions[ctx.sessions.length - 1]
          }
        },
        JOIN: {
          target: 'JOINING',
          action(ctx, key) {
            ctx.joinKey = key
          }
        }
      }
    },
    PLAYING: {
      on: {
        QUIT: {
          target: 'MENU',
          action() {}
        }
      }
    },
    JOINING: {
      on: {
        QUIT: {
          target: 'MENU',
          action() {}
        }
      }
    }
  }
})

// --- AppMachine transform ---

class AppMachine extends Transform {
  constructor(store) {
    super()
    this._store = store
    this._session = null
    this._multiplayer = null
    this._cm = new Coremachine(store.get({ name: 'app', valueEncoding: 'json' }), appConfig, {
      eager: true
    })
  }

  _open(cb) {
    this._cm.on('data', ({ state, context }) => {
      this._teardownSession()

      switch (state) {
        case 'PLAYING':
          cellery.app = gameApp
          this._session = this._createLocalSession(context.openSession)
          break
        case 'JOINING':
          cellery.app = gameApp
          this._session = this._createJoinSession(context.joinKey)
          break
        case 'MENU':
        default:
          cellery.app = menuApp
          cellery.render()

          if (context.sessions.length) {
            menu.showContinue = true
            menu.render()
          }
          break
      }
    })

    // on('data') triggers cm to open via resume()
    // default to menu — eager will override if resuming
    cellery.app = menuApp
    cellery.render()

    cb()
  }

  _transform(event, cb) {
    if (this._cm.state === 'MENU') {
      this._onMenu(event)
      cb()
      return
    }

    if (this._session) {
      if (event.error) {
        console.error('session error', event)
        cb()
        return
      }

      if (isAction(event) && event.data.value.trim() === 'quit') {
        this._transition('QUIT')
        cb()
        return
      }

      if (isAction(event) && event.data.value.trim() === 'multiplayer') {
        this._startMultiplayer()
        cb()
        return
      }

      this._session.write(event, cb)
      return
    }

    cb()
  }

  _destroy(cb) {
    this._teardownSession()
    this._cm.destroy()
    cb()
  }

  _transition(action, value) {
    this._teardownSession()
    this._cm.action(action, value)
  }

  _teardownSession() {
    if (this._multiplayer) {
      this._multiplayer.destroy()
      this._multiplayer = null
    }
    if (this._session) {
      this._session.destroy()
      this._session = null
    }
  }

  // --- menu ---

  _onMenu(event) {
    if (isClick(event, 'btn-new')) {
      this._transition('NEW_GAME')
    } else if (isClick(event, 'btn-continue')) {
      if (!this._cm.context.sessions.length) return
      this._transition('CONTINUE')
    } else if (isAction(event) && event.data.value.startsWith('join ')) {
      this._transition('JOIN', event.data.value.slice(5).trim())
    }
  }

  // --- local game session ---

  _createLocalSession(name) {
    const ns = this._store.namespace(name)
    const zork = Zork(ns)
    const self = this

    // isolate zork from pipeline — errors on unrecognised commands
    // would destroy the entire pipeline chain otherwise
    function onData(data) {
      self.push(data)
      if (self._multiplayer) self._multiplayer.broadcast(data)
    }

    function onError(err) {
      console.error('zork error:', err)
    }

    zork.on('data', onData)
    zork.on('error', onError)

    cellery.render()

    return {
      zork,
      write(event, cb) {
        if (isAction(event)) {
          zork.write({ action: 'COMMAND', value: event.data.value })
        }
        cb()
      },
      destroy() {
        zork.removeListener('data', onData)
        zork.removeListener('error', onError)
        zork.destroy()
      }
    }
  }

  // --- multiplayer (augments current session) ---

  _startMultiplayer() {
    if (this._multiplayer || !this._session) return

    const zork = this._session.zork
    const dht = new DHT()
    const keyPair = DHT.keyPair()
    const peers = new Set()

    const status = new Status({
      id: 'multiplayer',
      value: 'Starting multiplayer...'
    })
    status.render({ id: 'messages', insert: 'afterend' })

    const dhtServer = dht.createServer((conn) => {
      console.log('remote player connected')
      peers.add(conn)

      // peer commands → zork (manual write, not pipeline — so peer
      // disconnect doesn't destroy zork)
      conn.on('data', (data) => {
        try {
          const cmd = JSON.parse(data.toString('utf-8'))
          zork.write(cmd)
        } catch {}
      })

      conn.on('close', () => {
        peers.delete(conn)
        status.value = 'Hosting (' + peers.size + ' connected)'
        status.render()
      })

      conn.on('error', () => {
        peers.delete(conn)
      })

      // status.value = 'Hosting (' + peers.size + ' connected)'
      // status.render()

      // send current game state to newly joined peer
      cellery.render()
    })

    dhtServer.listen(keyPair).then(() => {
      const key = b4a.toString(keyPair.publicKey, 'hex')
      console.log('hosting on:', key)
      status.value = 'Hosting on ' + key
      status.render()
    })

    this._multiplayer = {
      broadcast(data) {
        const msg = JSON.stringify(data)
        for (const peer of peers) peer.write(msg)
      },
      destroy() {
        for (const peer of peers) peer.destroy()
        dhtServer.close()
        dht.destroy()
        status.destroy()
      }
    }
  }

  // --- join session ---

  _createJoinSession(key) {
    const self = this
    const dht = new DHT()
    const conn = dht.connect(b4a.from(key, 'hex'))

    const status = new Status({
      id: 'multiplayer',
      value: 'Connecting...'
    })

    // isolate conn — host disconnect shouldn't silently kill session
    conn.on('data', (data) => {
      try {
        self.push(JSON.parse(data.toString('utf-8')))
      } catch {}
    })

    conn.on('open', () => {
      console.log('connected to host')
      status.value = 'Connected to game'
      status.render()
    })

    conn.on('close', () => {
      status.value = 'Disconnected from host'
      status.render()
    })

    conn.on('error', (err) => {
      console.log('join error:', err)
      status.value = 'Connection failed'
      status.render()
    })

    // show connecting status immediately
    cellery.render()
    status.render({ id: 'messages', insert: 'afterend' })

    return {
      write(event, cb) {
        if (isAction(event)) {
          conn.write(JSON.stringify({ action: 'COMMAND', value: event.data.value }))
        }
        cb()
      },
      destroy() {
        conn.destroy()
        dht.destroy()
        status.destroy()
      }
    }
  }
}

// --- server setup ---

const server = http.createServer()
const appMachine = new AppMachine(store)

const wss = new ws.Server({ server }, (socket, req) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.searchParams.get('token') !== token) {
    socket.destroy()
    return
  }

  pipeline(
    cellery.sub({ event: 'render' }),
    new Transform({
      transform(data, cb) {
        this.push(JSON.stringify(data))
        cb()
      }
    }),
    socket,
    new Transform({
      transform(msg, cb) {
        try {
          this.push(JSON.parse(msg.toString('utf-8')))
        } catch {}
        cb()
      }
    }),
    appMachine,
    cellery
  )
})

server.listen(0, target.host, () => {
  const port = server.address().port
  console.log('ws listening on', target.host, port)

  if (!target.headless) {
    const window = new Window(800, 600)
    const webView = new WebView()
    window.content(webView)
    webView.loadHTML(html({ ...target, port, token }))
    webView.inspectable(true)
  }
})

wss.on('close', () => {
  console.log('ws closed')
  process.exit(1)
})

// --- matchers ---

function isAction(event) {
  return Iambus.match(event, {
    event: 'keydown',
    data: { id: 'cmd-input', key: 'Enter', shift: false }
  })
}

function isClick(event, id) {
  return Iambus.match(event, { event: 'click', data: { id } })
}
