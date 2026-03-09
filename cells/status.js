const { Spacing, Text, Size } = require('cellery')
const { Colours } = require('../styles')

const Status = Text.Styled({
  padding: Spacing.all(0.5),
  margin: Spacing.only({ top: 0.5 }),
  color: Colours.SoftBlue,
  size: Size.S
})

module.exports = Status
