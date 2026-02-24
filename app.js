const { Window, WebView } = require('bare-native')
const html = require('./view.html')
const ws = require('bare-ws')
const Console = require('bare-console')
const Corestore = require('corestore')
const { Transform } = require('streamx')
const { Zork } = require('zork-coremachine')
const Iambus = require('iambus')
const { pipeline } = require('streamx')
const config = require('#config')
const { cellery } = require('./ui')

const console = new Console()

if (!config.headless) {
  const window = new Window(800, 600)
  const webView = new WebView()
  window.content(webView)

  console.log('loading html')
  webView.loadHTML(html(config))
  webView.inspectable(true)
}

let backend

console.log('starting server')

const wss = new ws.Server({ port: config.port, host: config.host }, async (socket) => {
  console.log('starting backend')
  const store = new Corestore(config.storage || 'zork')
  const zork = Zork(store)

  // listen to renders and forward to websocket
  pipeline(
    cellery.sub({ event: 'render' }),
    new Transform({
      transform(data, cb) {
        this.push(JSON.stringify(data))
        cb()
      }
    }),
    socket
  )

  pipeline(
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
