const {
  Text,
  App,
  Container,
  Cellery,
  Input,
  Spacing,
  Color,
  Alignment,
  Size,
  Cell
} = require('cellery')
const { HTMLAdapter } = require('../adapters')
const { Message, Button } = require('../cells')
const { Colours } = require('../styles')

// --- menu view ---

class Menu extends Cell {
  constructor(showContinue) {
    super()
    this.showContinue = showContinue
  }

  _render() {
    const children = [
      new Text({
        id: 'title',
        value: 'ZORK',
        size: Size.XL,
        color: Color.from('#22c55e'),
        margin: Spacing.only({ bottom: 2 })
      }),
      new Button({
        id: 'btn-new',
        value: 'New Game',
        margin: Spacing.only({ bottom: 0.5 }),
        onclick: true
      })
    ]

    if (this.showContinue) {
      children.push(
        new Button({
          id: 'btn-continue',
          value: 'Continue',
          margin: Spacing.only({ bottom: 0.5 }),
          onclick: true
        })
      )
    }

    children.push(
      new Container({
        flex: Container.FlexAuto,
        alignment: Alignment.Horizontal({ items: 'center' }),
        children: [
          new Input({
            id: 'cmd-join',
            placeholder: 'Enter key to join a game'
          })
        ]
      })
    )

    return new Container({
      id: 'menu',
      flex: Container.FlexAuto,
      alignment: Alignment.Vertical({ items: 'center', justify: 'center' }),
      children
    })
  }
}

const menu = new Menu()

const menuApp = new App({ children: [menu] })

const cellery = new Cellery(menuApp, new HTMLAdapter())

// --- game view ---

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

const welcome = new Message({
  id: 'welcome',
  value: 'Welcome to Zork'
})

const messages = new Container({
  id: 'messages',
  flex: Container.FlexAuto,
  scroll: Container.ScrollVertical,
  padding: Spacing.all(1),
  children: [welcome],
  alignment: Alignment.Vertical({ justify: 'center' })
})

const warnings = new Container({
  id: 'warnings',
  padding: Spacing.all(0.5),
  margin: Spacing.only({ top: 0.5 }),
  color: Colours.Orange,
  size: Size.S,
  children: [],
  alignment: Alignment.Vertical({})
})

const gameApp = new App({ children: [messages, warnings, cmd] })

// --- dynamic subscriptions ---

welcome.sub({ context: { gameOver: false } }, (cell, { context }) => {
  if (!context.output) {
    return
  }

  const { location, text } = context.output

  if (location) {
    cell.prefix = location
  }

  cell.value = text.replaceAll('\n', '<br>')
  cell.render({ id: 'messages', insert: 'beforeend', clear: true })
})
welcome.sub({ context: { gameOver: true, won: false } }, (cell) => {
  cell.value = 'Game over!'
  cell.render({ id: 'messages', insert: 'beforeend', clear: true })
})
welcome.sub({ context: { gameOver: true, won: true } }, (cell) => {
  cell.value = 'You win!'
  cell.render({ id: 'messages', insert: 'beforeend', clear: true })
})

warnings.sub({ context: { gameOver: false } }, (cell, { context }) => {
  if (!context.output) return

  const { warnings } = context.output

  if (!warnings?.length) {
    return
  }

  console.log('warnings!', warnings)
  cell.children = warnings.map((value) => new Text({ value, cellery }))
  cell.render()
})

module.exports = { cellery, menuApp, gameApp, menu, cmdInput }
