export default class SortableTable {
  element
  subElements = {}

  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig
    this.data = data
    this.sorted = { id: '', order: '' }

    this.render()
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
        ${column.sortable ? this.getSortArrow() : ''}
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
    return this.headerConfig.map(column => {
      if (column.template) {
        return column.template(item[column.id])
      }
      return `<div class="sortable-table__cell">${item[column.id]}</div>`
    }).join('')
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

    this.initEventListeners()
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
    const newOrder = order === 'asc' ? 'desc' : 'asc'

    this.sort(id, newOrder)
  }

  sort(field, order) {
    if (!this.isSortable(field)) return

    const sortedData = this.sortData(field, order)
    this.sorted = { id: field, order }

    this.updateTableHeader()
    this.updateTableBody(sortedData)
  }

  isSortable(field) {
    const column = this.headerConfig.find(item => item.id === field)
    return column && column.sortable
  }

  sortData(field, order) {
    const column = this.headerConfig.find(item => item.id === field)
    if (!column || !column.sortable) return this.data

    const direction = order === 'asc' ? 1 : -1

    return [...this.data].sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]

      return column.sortType === 'number' ?
        direction * (aValue - bValue) :
        direction * aValue.localeCompare(bValue, ['ru', 'en'], { caseFirst: 'upper' })
    })
  }

  updateTableHeader() {
    this.subElements.header.innerHTML = this.headerConfig.map(column => this.getHeaderCell(column)).join('')
    this.subElements.header = this.element.querySelector('[data-element="header"]')
  }

  updateTableBody(data) {
    this.subElements.body.innerHTML = this.getTableRows(data)
  }

  remove() {
    this.element && this.element.remove()
  }

  destroy() {
    this.remove()
    this.element = null
    this.subElements = {}
  }
}