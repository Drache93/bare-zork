const { Size, Container } = require('cellery')

const html = String.raw

function renderChildren() {
  let childrenHTML = ''
  if (this.children && this.children.length > 0) {
    for (const child of this.children) {
      childrenHTML += this.renderer._renderCell(child)
    }
  }

  return childrenHTML
}

const sizes = {
  [Size.XS]: '0.5rem',
  [Size.S]: '0.75rem',
  [Size.M]: '1rem',
  [Size.L]: '1.5rem',
  [Size.XL]: '2rem'
}

function renderStyle(cell) {
  const style = []

  if (cell.padding) {
    for (const k of Object.keys(cell.padding)) {
      if (!cell.padding[k]) continue
      style.push(`padding-${k}: ${cell.padding[k]}rem;`)
    }
  }

  if (cell.margin) {
    for (const k of Object.keys(cell.margin)) {
      if (!cell.margin[k]) continue
      style.push(`margin-${k}: ${cell.margin[k]}rem;`)
    }
  }

  if (cell.color) {
    style.push(`color: ${cell.color.toRGBA()};`)
  }

  if (cell.alignment) {
    style.push(`flex-direction: ${cell.alignment.direction === 'vertical' ? 'column' : 'row'};`)
    style.push(`justify-content: ${cell.alignment.justify || 'start'};`)
    style.push(`align-items: ${cell.alignment.items || 'start'};`)
  }

  if (cell.decoration?.border) {
    const borderColor = cell.decoration.border.color?.toRGBA() || '#000'
    style.push(`border: ${cell.decoration.border.width}px solid ${borderColor};`)
  }

  if (cell.size) {
    style.push(`font-size: ${sizes[cell.size] || sizes[Size.M]}`)
  }

  return style.join('')
}

class HTMLAdapter {
  components = {
    App: function () {
      return renderChildren.call(this)
    },
    Container: function (style) {
      let overflow = ''
      let flex = ''

      switch (this.scroll) {
        case Container.ScrollVertical: {
          overflow = 'overflow-y-auto'
          break
        }
        case Container.ScrollHorizontal: {
          overflow = 'overflow-x-auto'
          break
        }
        case Container.ScrollAll: {
          overflow = 'overflow-auto'
          break
        }
        case Container.ScrollNone: {
          overflow = 'overflow-hidden'
          break
        }
      }

      switch (this.flex) {
        case Container.FlexAuto: {
          flex = 'flex-1'
          break
        }
      }

      return html`<div id="${this.id}" style="${style}" class="flex ${flex} ${overflow} text-sm">
        ${renderChildren.call(this)}
      </div>`
    },
    Paragraph: function (style) {
      return html`<span id="${this.id}" class="text-wrap" style="${style}"
        >${renderChildren.call(this)}</span
      >`
    },
    Text: function (style) {
      // todo: fix safety
      return html`<span id="${this.id}" style="${style};">${this.value.toString()}</span>`
    },
    Input: function () {
      // TODO: options

      if (!this.multiline) {
        return html`<input
          id="${this.id}"
          type="${this.type}"
          class="flex-1 bg-transparent outline-none text-green-500 placeholder-green-900"
          placeholder="${this.placeholder}"
          autofocus
        ></input>`
      }

      return html`<textarea
        id="${this.id}"
        type="${this.type}"
        class="flex-1 bg-transparent outline-none text-green-500 placeholder-green-900 field-sizing-content min-h-lh! max-h-[5lh]! resize-none"
        placeholder="${this.placeholder}"
        autofocus
      ></textarea>`
    }
  }

  _renderCell(component) {
    if (component._render) {
      // get the cell out without triggering another render
      component = component._render()
    }

    component.renderer = this
    const style = renderStyle(component)
    const rendererFn = this.components[component.constructor.name]
    return rendererFn.call(component, style)
  }

  render(cell) {
    return this._renderCell(cell)
  }
}

module.exports = HTMLAdapter
