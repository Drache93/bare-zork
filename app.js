const { Window, WebView } = require('bare-native')
const html = require('./view.html')
const ws = require('bare-ws')
const http = require('bare-http1')
const Console = require('bare-console')
const Corestore = require('corestore')
const { Transform } = require('streamx')
const { Zork } = require('zork-machine')
const Iambus = require('iambus')
const { pipeline } = require('streamx')
const target = require('#target')
const { cellery } = require('./views/main')

const console = new Console()

const token = require('bare-crypto').randomBytes(32).toString('hex')

const server = http.createServer()

const wss = new ws.Server({ server }, async (socket, req) => {
  const url = new URL(req.url, 'http://localhost')
  const incoming = url.searchParams.get('token')

  if (incoming !== token) {
    console.log('rejected connection: invalid token')
    socket.destroy()
    return
  }

  console.log('authenticated client connected')
  const store = new Corestore(target.storage || 'zork')
  const zork = Zork(store)

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
        const event = JSON.parse(msg.toString('utf-8'))

        if (isAction(event)) {
          console.log('zork input:', event.data.value)
          this.push({ action: 'COMMAND', value: event.data.value })
        }
        cb()
      }
    }),
    zork,
    cellery
  )

  cellery.render()
})

server.listen(0, target.host, () => {
  const port = server.address().port
  console.log('ws listening on', target.host, port)

  if (!target.headless) {
    const window = new Window(800, 600)
    const webView = new WebView()
    window.content(webView)

    console.log('loading html')
    webView.loadHTML(html({ ...target, port, token }))
    webView.inspectable(true)
  }
})

wss.on('close', () => {
  console.log('ws closed')
  process.exit(1)
})

function isAction(event) {
  return Iambus.match(event, {
    event: 'keydown',
    data: { id: 'cmd-input', key: 'Enter', shift: false }
  })
}
