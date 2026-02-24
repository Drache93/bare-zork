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
  children: [],
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

// dynamically added stuff
const welcome = new Message({
  id: 'welcome',
  value: '',
  cellery // explicity give it cellery as it is added dynamically
})
welcome.sub({ context: { gameOver: false } }, (cell, { context }) => {
  cell.value = context.output
  cell.render({ id: 'messages', insert: 'beforeend' })
})
welcome.sub({ context: { gameOver: true, won: false } }, (cell) => {
  cell.value = `Game over!`
  cell.render({ id: 'messages', insert: 'beforeend' })
})
welcome.sub({ context: { gameOver: true, won: true } }, (cell) => {
  cell.value = `You win!`
  cell.render({ id: 'messages', insert: 'beforeend' })
})

module.exports = { cellery, Message, cmdInput, Colours }
