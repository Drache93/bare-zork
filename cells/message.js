const { Cell, Text, Paragraph, Spacing } = require('cellery')
const { Colours } = require('../styles')

class Message extends Cell {
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

module.exports = Message
