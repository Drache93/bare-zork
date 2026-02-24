const { Text, App, Container, Cellery, Input, Spacing, Color, Alignment, Size } = require('cellery')
const { HTMLAdapter } = require('../adapters')
const { Message } = require('../cells')
const { Colours } = require('../styles')

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
  alignment: Alignment.Vertical({ justify: 'center' })
})

const app = new App({
  children: [messages, cmd]
})

const cellery = new Cellery(app, new HTMLAdapter())

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

  cell.value = text.replaceAll('\n', '<br>')
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

module.exports = { cellery, cmdInput }
