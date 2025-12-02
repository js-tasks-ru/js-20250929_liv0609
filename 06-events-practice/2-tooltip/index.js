class Tooltip {
  static instance
  static offset = 10

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance
    }

    Tooltip.instance = this
  }

  initialize() {
    this.addEventListeners()
  }

  addEventListeners() {
    document.addEventListener('pointerover', this.handlePointerOver)
    document.addEventListener('pointerout', this.handlePointerOut)
    document.addEventListener('pointermove', this.handlePointerMove)
  }

  removeEventListeners() {
    document.removeEventListener('pointerover', this.handlePointerOver)
    document.removeEventListener('pointerout', this.handlePointerOut)
    document.removeEventListener('pointermove', this.handlePointerMove)
  }

  handlePointerOver = (event) => {
    const target = event.target.closest('[data-tooltip]')

    if (target) {
      this.render(target.dataset.tooltip)
    }
  }

  handlePointerOut = (event) => {
    if (!event.relatedTarget || !event.relatedTarget.closest('[data-tooltip]')) {
      this.remove()
    }
  }

  handlePointerMove = (event) => {
    if (!this.element) return

    this.moveTooltip(event)
  }

  render(content = '') {
    this.createElement()
    this.element.textContent = content
    document.body.appendChild(this.element)
  }

  createElement() {
    if (this.element) return

    const element = document.createElement('div')
    element.className = 'tooltip'
    element.style.position = 'absolute'
    element.style.zIndex = '1000'
    element.style.pointerEvents = 'none'

    this.element = element
  }

  moveTooltip(event) {
    const x = event.clientX + this.offset
    const y = event.clientY + this.offset

    this.element.style.left = `${x}px`
    this.element.style.top = `${y}px`
  }

  remove() {
    this.element && this.element.remove()
  }

  destroy() {
    this.removeEventListeners()
    this.remove()
  }
}

export default Tooltip