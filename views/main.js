const { Text, App, Container, Cellery, Input, Spacing, Color, Alignment, Size } = require('cellery')
const { HTMLAdapter } = require('../adapters')
const { Message, Button } = require('../cells')
const { Colours } = require('../styles')

// --- menu view ---

const menu = new Container({
  id: 'menu',
  flex: Container.FlexAuto,
  alignment: Alignment.Vertical({ items: 'center', justify: 'center' }),
  children: [
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
    }),
    new Input({
      id: 'cmd-input',
      placeholder: 'join <key>',
      alignment: Alignment.Horizontal({ items: 'center' })
    })
  ]
})

const menuApp = new App({ children: [menu] })

const cellery = new Cellery(menuApp, new HTMLAdapter())

// todo render
const continueGame = new Button({
  id: 'btn-continue',
  value: 'Continue',
  margin: Spacing.only({ bottom: 0.5 }),
  onclick: true
})

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

const gameApp = new App({ children: [messages, cmd] })

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

const warnings = new Container({
  id: 'warnings',
  padding: Spacing.all(0.5),
  margin: Spacing.only({ top: 0.5 }),
  color: Colours.Orange,
  size: Size.S,
  children: [],
  alignment: Alignment.Vertical({})
})
warnings.sub({ context: { gameOver: false } }, (cell, { context }) => {
  if (!context.output) return

  const { warnings } = context.output

  if (!warnings?.length) {
    cell.destroy()
    return
  }

  console.log('warnings!', warnings)
  cell.children = warnings.map((value) => new Text({ value, cellery }))
  cell.render({ id: 'messages', insert: 'afterend' })
})

module.exports = { cellery, menuApp, gameApp, cmdInput }
