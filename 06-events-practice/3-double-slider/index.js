export default class DoubleSlider {
  element
  subElements = {}

  constructor({ min = 100, max = 200, formatValue = value => value, selected = { from: min, to: max } } = {}) {
    this.min = min
    this.max = max
    this.formatValue = formatValue
    this.selected = selected

    this.render()
    this.initEventListeners()
  }

  get template() {
    const { from, to } = this.selected
    const left = this.calculatePosition(from)
    const right = this.calculatePosition(to)

    return `
      <div class="range-slider">
        <span data-element="from">${this.formatValue(from)}</span>
        <div class="range-slider__inner">
          <span class="range-slider__progress" style="left: ${left}%; right: ${100 - right}%"></span>
          <span class="range-slider__thumb-left" style="left: ${left}%"></span>
          <span class="range-slider__thumb-right" style="left: ${right}%"></span>
        </div>
        <span data-element="to">${this.formatValue(to)}</span>
      </div>
    `
  }

  render() {
    const element = document.createElement('div')
    element.innerHTML = this.template
    this.element = element.firstElementChild

    this.subElements = this.getSubElements()
  }

  getSubElements() {
    const result = {}
    const elements = this.element.querySelectorAll('[data-element]')

    for (const subElement of elements) {
      const name = subElement.dataset.element
      result[name] = subElement
    }

    return result
  }

  initEventListeners() {
    const { thumbLeft, thumbRight } = this.getThumbElements()

    thumbLeft.addEventListener('pointerdown', this.onThumbPointerDown)
    thumbRight.addEventListener('pointerdown', this.onThumbPointerDown)
  }

  getThumbElements() {
    return {
      thumbLeft: this.element.querySelector('.range-slider__thumb-left'),
      thumbRight: this.element.querySelector('.range-slider__thumb-right')
    }
  }

  onThumbPointerDown = (event) => {
    event.preventDefault()

    const thumb = event.target
    this.dragging = thumb
    this.element.classList.add('range-slider_dragging')

    document.addEventListener('pointermove', this.onThumbPointerMove)
    document.addEventListener('pointerup', this.onThumbPointerUp)
  }

  onThumbPointerMove = (event) => {
    event.preventDefault()

    const innerElement = this.element.querySelector('.range-slider__inner')
    const { left, width } = innerElement.getBoundingClientRect()

    const clientX = event.clientX
    const percentage = ((clientX - left) / width) * 100
    const clampedPercentage = Math.max(0, Math.min(100, percentage))

    this.dragging.classList.contains('range-slider__thumb-left') ?
      this.updateLeftThumb(clampedPercentage) :
      this.updateRightThumb(clampedPercentage)

    this.updateProgress()
    this.updateValues()
  }

  onThumbPointerUp = () => {
    this.element.classList.remove('range-slider_dragging')

    document.removeEventListener('pointermove', this.onThumbPointerMove)
    document.removeEventListener('pointerup', this.onThumbPointerUp)

    this.dragging = null
    this.dispatchRangeSelectEvent()
  }

  updateLeftThumb(percentage) {
    const rightThumb = this.element.querySelector('.range-slider__thumb-right')
    const rightThumbPosition = parseFloat(rightThumb.style.left)

    if (percentage > rightThumbPosition) {
      percentage = rightThumbPosition
    }

    this.dragging.style.left = `${percentage}%`
  }

  updateRightThumb(percentage) {
    const leftThumb = this.element.querySelector('.range-slider__thumb-left')
    const leftThumbPosition = parseFloat(leftThumb.style.left)

    if (percentage < leftThumbPosition) {
      percentage = leftThumbPosition
    }

    this.dragging.style.left = `${percentage}%`
  }

  updateProgress() {
    const progress = this.element.querySelector('.range-slider__progress')
    const leftThumbPosition = parseFloat(this.element.querySelector('.range-slider__thumb-left').style.left)
    const rightThumbPosition = parseFloat(this.element.querySelector('.range-slider__thumb-right').style.left)

    progress.style.left = `${leftThumbPosition}%`
    progress.style.right = `${100 - rightThumbPosition}%`
  }

  updateValues() {
    const leftThumbPosition = parseFloat(this.element.querySelector('.range-slider__thumb-left').style.left)
    const rightThumbPosition = parseFloat(this.element.querySelector('.range-slider__thumb-right').style.left)

    const from = this.calculateValue(leftThumbPosition)
    const to = this.calculateValue(rightThumbPosition)

    this.subElements.from.textContent = this.formatValue(from)
    this.subElements.to.textContent = this.formatValue(to)

    this.selected = { from, to }
  }

  calculatePosition(value) {
    return ((value - this.min) / (this.max - this.min)) * 100
  }

  calculateValue(percentage) {
    return Math.round(this.min + (percentage / 100) * (this.max - this.min))
  }

  dispatchRangeSelectEvent() {
    const event = new CustomEvent('range-select', {
      detail: this.selected,
      bubbles: true
    })

    this.element.dispatchEvent(event)
  }

  destroy() {
    this.element && this.element.remove()

    document.removeEventListener('pointermove', this.onThumbPointerMove)
    document.removeEventListener('pointerup', this.onThumbPointerUp)
  }
}