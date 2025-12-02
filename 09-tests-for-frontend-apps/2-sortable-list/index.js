export default class SortableList {
  element
  draggingElement
  placeholderElement
  shiftX = 0
  shiftY = 0

  constructor({ items = [] } = {}) {
    this.items = items
    this.render()
    this.initEventListeners()
  }

  render() {
    this.element = document.createElement('ul')
    this.element.className = 'sortable-list'

    this.items.forEach(item => {
      item.classList.add('sortable-list__item')
      this.element.append(item)
    })
  }

  initEventListeners() {
    this.element.addEventListener('pointerdown', event => {
      this.onPointerDown(event)
    })
  }

  onPointerDown(event) {
    const grabHandle = event.target.closest('[data-grab-handle]')
    const deleteHandle = event.target.closest('[data-delete-handle]')

    if (grabHandle) {
      event.preventDefault()
      this.startDragging(grabHandle.closest('.sortable-list__item'), event)
    }

    if (deleteHandle) {
      event.preventDefault()
      this.removeItem(deleteHandle.closest('.sortable-list__item'))
    }
  }

  startDragging(item, event) {
    this.draggingElement = item
    this.draggingElement.classList.add('sortable-list__item_dragging')

    this.createPlaceholder()
    this.setPlaceholderDimensions()

    const rect = this.draggingElement.getBoundingClientRect()
    this.shiftX = event.clientX - rect.left
    this.shiftY = event.clientY - rect.top

    this.moveAt(event.pageX, event.pageY)

    document.addEventListener('pointermove', this.onPointerMove)
    document.addEventListener('pointerup', this.onPointerUp)
  }

  createPlaceholder() {
    this.placeholderElement = document.createElement('li')
    this.placeholderElement.className = 'sortable-list__placeholder'
    this.draggingElement.after(this.placeholderElement)
  }

  setPlaceholderDimensions() {
    const rect = this.draggingElement.getBoundingClientRect()
    this.placeholderElement.style.width = `${rect.width}px`
    this.placeholderElement.style.height = `${rect.height}px`
  }

  onPointerMove = (event) => {
    this.moveAt(event.pageX, event.pageY)
    this.updatePlaceholderPosition(event.clientX, event.clientY)
  }

  moveAt(pageX, pageY) {
    this.draggingElement.style.left = `${pageX - this.shiftX}px`
    this.draggingElement.style.top = `${pageY - this.shiftY}px`
  }

  updatePlaceholderPosition(clientX, clientY) {
    const elements = Array.from(this.element.children).filter(child =>
      child !== this.draggingElement && child !== this.placeholderElement
    )

    if (elements.length === 0) return

    let closestElement = null
    let closestDistance = Infinity

    for (const element of elements) {
      const rect = element.getBoundingClientRect()
      const elementCenterY = rect.top + rect.height / 2
      const distance = Math.abs(clientY - elementCenterY)

      if (distance < closestDistance) {
        closestDistance = distance
        closestElement = element
      }
    }

    if (closestElement) {
      const rect = closestElement.getBoundingClientRect()
      const shouldPlaceBefore = clientY < rect.top + rect.height / 2

      if (shouldPlaceBefore) {
        closestElement.before(this.placeholderElement)
      } else {
        closestElement.after(this.placeholderElement)
      }
    }
  }

  onPointerUp = () => {
    this.stopDragging()
  }

  stopDragging() {
    if (this.placeholderElement && this.draggingElement) {
      this.placeholderElement.replaceWith(this.draggingElement)
      this.draggingElement.classList.remove('sortable-list__item_dragging')
      this.draggingElement.style.left = ''
      this.draggingElement.style.top = ''
    }

    this.cleanup()
  }

  removeItem(item) {
    if (item) {
      item.remove()

      const index = this.items.indexOf(item)
      if (index > -1) {
        this.items.splice(index, 1)
      }
    }
  }

  cleanup() {
    document.removeEventListener('pointermove', this.onPointerMove)
    document.removeEventListener('pointerup', this.onPointerUp)

    this.draggingElement = null
    this.placeholderElement = null
    this.shiftX = 0
    this.shiftY = 0
  }

  remove() {
    this.element && this.element.remove()
  }

  destroy() {
    this.cleanup()
    this.remove()
  }
}