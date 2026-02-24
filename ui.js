const {
  Text,
  App,
  Container,
  Cellery,
  Input,
  Spacing,
  Color,
  Alignment,
  MultiCell,
  Size,
  Paragraph
} = require('cellery')
const { HTMLAdapter } = require('./adapter')

class Message extends MultiCell {
  constructor(opts = {}) {
    super(opts)
    this.value = opts.value
    this.prefix = opts.prefix
  }

  _render() {
    const children = [
      new Text({
        value: this.value
      })
    ]

    if (this.prefix) {
      children.unshift(
        new Text({
          value: `[${this.prefix}]`,
          color: Colours.Blue,
          margin: Spacing.only({ right: 0.5 })
        })
      )
    }

    return new Paragraph({
      id: this.id,
      children
    })
  }
}

const cmdInput = new Input({
  id: 'cmd-input',
  multiline: true,
  placeholder: 'Enter command'
})

const cmd = new Container({
  id: 'cmd',
  padding: Spacing.all(0.5),
  margin: Spacing.symmetric({ vertical: 0.5 }),
  alignment: Alignment.Horizontal({ items: 'center' }),
  children: [
    new Text({
      value: '$',
      color: Color.from('#00d3f2'),
      margin: Spacing.only({ right: 1 })
    }),
    cmdInput
  ]
})

const messages = new Container({
  id: 'messages',
  flex: Container.FlexAuto,
  scroll: Container.ScrollVertical,
  padding: Spacing.all(1),
  children: [new Text({ value: 'Welcome to Zork' })],
  alignment: Alignment.Vertical({})
})

const app = new App({
  children: [messages, cmd]
})

const cellery = new Cellery(app, new HTMLAdapter())

const Colours = {
  Orange: Color.from('#fdc700'),
  SoftBlue: Color.from('#51a2ff'),
  Error: Color.from('#ff6467'),
  Green: Color.from('#00c950'),
  Cyan: Color.from('#00d3f2'),
  Blue: Color.from('#1447e6')
}

// dynamically added stuff
const welcome = new Message({
  id: 'welcome',
  value: 'Welcome to Zork',
  cellery
})

welcome.sub({ context: { gameOver: false } }, (cell, { context }) => {
  const { location, text } = context.output

  if (location) {
    cell.prefix = location
  }

  cell.value = text
  cell.render({ id: 'messages', insert: 'beforeend', clear: true })
})
welcome.sub({ context: { gameOver: true, won: false } }, (cell) => {
  cell.value = `Game over!`
  cell.render({ id: 'messages', insert: 'beforeend', clear: true })
})
welcome.sub({ context: { gameOver: true, won: true } }, (cell) => {
  cell.value = `You win!`
  cell.render({ id: 'messages', insert: 'beforeend', clear: true })
})

const warnings = new Container({
  id: 'warnings',
  padding: Spacing.all(0.5),
  margin: Spacing.only({ top: 0.5 }),
  color: Colours.Orange,
  size: Size.S,
  children: [],
  alignment: Alignment.Vertical({}),
  cellery
})
warnings.sub({ context: { gameOver: false } }, (cell, { context }) => {
  const { warnings } = context.output

  if (!warnings?.length) {
    cell.destroy()
    return
  }

  cell.children = warnings.map((value) => new Text({ value, cellery }))
  cell.render({ id: 'messages', insert: 'afterend' })
})

module.exports = { cellery, Message, cmdInput, Colours }
