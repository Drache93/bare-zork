const { Text, Spacing, Size, Color } = require('cellery')

const Button = Text.Styled({
  tag: 'button',
  padding: Spacing.symmetric({ vertical: 0.5, horizontal: 2 }),
  color: Color.from('#00d3f2'),
  size: Size.M
})

module.exports = Button
