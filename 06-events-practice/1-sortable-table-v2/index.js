export default class SortableTable {
  element
  subElements = {}

  constructor(headerConfig = [], { data = [], sorted = {}, isSortLocally = true } = {}) {
    this.headerConfig = headerConfig
    this.data = data
    this.sorted = sorted
    this.isSortLocally = isSortLocally

    this.render()
    this.initEventListeners()

    if (this.sorted.id) {
      this.sort(this.sorted.id, this.sorted.order)
    }
  }

  getTableHeader() {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.headerConfig.map(column => this.getHeaderCell(column)).join('')}
      </div>
    `
  }

  getHeaderCell(column) {
    const order = this.sorted.id === column.id ? this.sorted.order : ''

    return `
      <div class="sortable-table__cell" data-id="${column.id}" data-sortable="${column.sortable}" data-order="${order}">
        <span>${column.title}</span>
        ${column.sortable && this.sorted.id === column.id ? this.getSortArrow() : ''}
      </div>
    `
  }

  getSortArrow() {
    return `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    `
  }

  getTableBody() {
    return `
      <div data-element="body" class="sortable-table__body">
        ${this.getTableRows(this.data)}
      </div>
    `
  }

  getTableRows(data = []) {
    return data.map(item => `
      <a href="/products/${item.id}" class="sortable-table__row">
        ${this.getTableRow(item)}
      </a>
    `).join('')
  }

  getTableRow(item) {
    const cells = this.headerConfig.map(column => {
      if (column.template) {
        return column.template(item[column.id])
      }
      return `<div class="sortable-table__cell">${item[column.id]}</div>`
    })

    return cells.join('')
  }

  getTable() {
    return `
      <div class="sortable-table">
        ${this.getTableHeader()}
        ${this.getTableBody()}
      </div>
    `
  }

  render() {
    const element = document.createElement('div')
    element.innerHTML = this.getTable()

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
    this.subElements.header.addEventListener('pointerdown', this.onSortClick)
  }

  onSortClick = (event) => {
    const column = event.target.closest('[data-sortable="true"]')

    if (!column) return

    const { id, order } = column.dataset
    const newOrder = order === 'desc' ? 'asc' : 'desc'

    this.sort(id, newOrder)
  }

  sort(field, order) {
    if (this.isSortLocally) {
      this.sortOnClient(field, order)
    } else {
      this.sortOnServer(field, order)
    }
  }

  sortOnClient(field, order) {
    if (!this.isSortable(field)) return

    const sortedData = this.sortData(field, order)
    this.sorted = { id: field, order }

    this.updateTableHeader()
    this.updateTableBody(sortedData)
  }

  sortOnServer(field, order) {
    console.log('Server sorting for:', field, order)
  }

  isSortable(field) {
    const column = this.headerConfig.find(item => item.id === field)
    return column && column.sortable
  }

  sortData(field, order) {
    const column = this.headerConfig.find(item => item.id === field)
    if (!column || !column.sortable) return this.data

    const direction = order === 'asc' ? 1 : -1
    const sortType = column.sortType || 'string'

    return [...this.data].sort((a, b) => {
      if (column.sortFunction) {
        return direction * column.sortFunction(a[field], b[field])
      }

      const aValue = a[field]
      const bValue = b[field]

      switch (sortType) {
        case 'number':
          return direction * (aValue - bValue)
        case 'string':
        default:
          return direction * aValue.localeCompare(bValue, ['ru', 'en'], {
            caseFirst: 'upper',
            sensitivity: 'case'
          })
      }
    })
  }

  updateTableHeader() {
    const currentActiveCell = this.subElements.header.querySelector('[data-order]')
    if (currentActiveCell) {
      currentActiveCell.removeAttribute('data-order')
      const existingArrow = currentActiveCell.querySelector('[data-element="arrow"]')
      if (existingArrow) {
        existingArrow.remove()
      }
    }

    const newActiveCell = this.subElements.header.querySelector(`[data-id="${this.sorted.id}"]`)
    if (newActiveCell) {
      newActiveCell.dataset.order = this.sorted.order
      newActiveCell.insertAdjacentHTML('beforeend', this.getSortArrow())
    }

    // const headerCells = this.headerConfig.map(column => this.getHeaderCell(column)).join('')
    // this.subElements.header.innerHTML = headerCells

    // this.subElements.header = this.element.querySelector('[data-element="header"]')
  }

  updateTableBody(data) {
    this.subElements.body.innerHTML = this.getTableRows(data)
  }

  remove() {
    this.element && this.element.remove()
  }

  destroy() {
    this.remove()
  }
}