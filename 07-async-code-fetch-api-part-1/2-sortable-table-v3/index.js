import fetchJson from './utils/fetch-json.js'

const BACKEND_URL = 'https://course-js.javascript.ru'

export default class SortableTable {
  element
  subElements = {}
  data = []
  loading = false
  isSortLocally = false

  constructor(headerConfig = [], {
    url = '',
    sorted = {},
    isSortLocally = false,
    step = 20,
    start = 1,
    end = start + step
  } = {}) {
    this.headerConfig = headerConfig
    this.url = new URL(url, BACKEND_URL)
    this.sorted = sorted
    this.isSortLocally = isSortLocally
    this.step = step
    this.start = start
    this.end = end

    this.render()
  }

  async render() {
    const { id, order } = this.sorted
    const wrapper = document.createElement('div')
    wrapper.innerHTML = this.getTable()

    this.element = wrapper.firstElementChild
    this.subElements = this.getSubElements()

    this.data = await this.loadData(id, order, this.start, this.end)
    this.renderRows(this.data)
    this.initEventListeners()
  }

  getTable() {
    return `
      <div class="sortable-table">
        ${this.getTableHeader()}
        ${this.getTableBody()}
        ${this.getLoadingTemplate()}
        ${this.getEmptyPlaceholder()}
      </div>
    `
  }

  getTableHeader() {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.headerConfig.map(item => this.getHeaderCell(item)).join('')}
      </div>
    `
  }

  getHeaderCell({ id, title, sortable }) {
    const order = this.sorted.id === id ? this.sorted.order : 'asc'

    return `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}" data-order="${order}">
        <span>${title}</span>
        ${this.getSortingArrow(id)}
      </div>
    `
  }

  getSortingArrow(id) {
    const isOrderExist = this.sorted.id === id ? this.sorted.order : ''

    return isOrderExist
      ? `<span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>`
      : ''
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
        ${this.getTableRow(item, data)}
      </a>
    `).join('')
  }

  getTableRow(item) {
    const cells = this.headerConfig.map(({ id, template }) => {
      return {
        id,
        template
      }
    })

    return cells.map(({ id, template }) => {
      return template
        ? template(item[id])
        : `<div class="sortable-table__cell">${item[id]}</div>`
    }).join('')
  }

  getLoadingTemplate() {
    return `
      <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
    `
  }

  getEmptyPlaceholder() {
    return `
      <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
        <div>
          <p>No products found</p>
        </div>
      </div>
    `
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
    document.addEventListener('scroll', this.onWindowScroll)
  }

  onSortClick = event => {
    const column = event.target.closest('[data-sortable="true"]')
    const toggleOrder = order => {
      const orders = {
        asc: 'desc',
        desc: 'asc'
      }

      return orders[order]
    }

    if (column) {
      const { id, order } = column.dataset
      const newOrder = toggleOrder(order)

      this.sorted = {
        id,
        order: newOrder
      }

      this.sort(id, newOrder)
    }
  }

  onWindowScroll = async () => {
    const { bottom } = this.element.getBoundingClientRect()
    const { clientHeight } = document.documentElement

    if (bottom < clientHeight && !this.loading && !this.isSortLocally) {
      this.start = this.end
      this.end = this.start + this.step

      this.loading = true

      const data = await this.loadData(this.sorted.id, this.sorted.order, this.start, this.end)
      this.update(data)

      this.loading = false
    }
  }

  sortOnClient(id, order) {
    const sortedData = this.sortData(id, order)
    this.subElements.body.innerHTML = this.getTableRows(sortedData)
  }

  async sortOnServer(id, order) {
    this.start = 1
    this.end = this.start + this.step

    const data = await this.loadData(id, order, this.start, this.end)
    this.renderRows(data)
  }

  async loadData(id, order, start, end) {
    this.url.searchParams.set('_sort', id)
    this.url.searchParams.set('_order', order)
    this.url.searchParams.set('_start', start)
    this.url.searchParams.set('_end', end)

    this.element.classList.add('sortable-table_loading')

    try {
      const data = await fetchJson(this.url)
      this.element.classList.remove('sortable-table_loading')

      return data
    } catch (error) {
      console.error('Error loading data:', error)
      this.element.classList.remove('sortable-table_loading')
      return []
    }
  }

  renderRows(data) {
    if (data.length) {
      this.element.classList.remove('sortable-table_empty')
      this.subElements.body.innerHTML = this.getTableRows(data)
    } else {
      this.element.classList.add('sortable-table_empty')
    }
  }

  update(data) {
    const rows = document.createElement('div')

    this.data = [...this.data, ...data]
    rows.innerHTML = this.getTableRows(data)

    this.subElements.body.append(...rows.childNodes)
  }

  sort(field, order) {
    if (this.isSortLocally) {
      this.sortOnClient(field, order)
    } else {
      this.sortOnServer(field, order)
    }
  }

  sortData(field, order) {
    const arr = [...this.data]
    const column = this.headerConfig.find(item => item.id === field)
    const { sortType } = column
    const directions = {
      asc: 1,
      desc: -1
    }
    const direction = directions[order]

    return arr.sort((a, b) => {
      switch (sortType) {
        case 'number':
          return direction * (a[field] - b[field])
        case 'string':
          return direction * a[field].localeCompare(b[field], ['ru', 'en'])
        default:
          return direction * (a[field] - b[field])
      }
    })
  }

  remove() {
    this.element && this.element.remove()
  }

  destroy() {
    this.remove()
    document.removeEventListener('scroll', this.onWindowScroll)
    this.subElements = {}
  }
}