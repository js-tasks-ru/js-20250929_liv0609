import BaseSortableTable from '../../05-dom-document-loading/2-sortable-table-v1/index'

export default class SortableTable extends BaseSortableTable {
  element
  subElements = {}

  constructor(
    headerConfig = [],
    {
      data = [],
      sorted = {
        id: headerConfig.find(item => item.sortable).id,
        order: 'asc'
      },
      isSortLocally = true
    } = {}
  ) {
    super(headerConfig, data)
    
    this.headerConfig = headerConfig
    this.data = data
    this.sorted = sorted
    this.isSortLocally = isSortLocally

    this.render()
  }

  render() {
    super.render()
    
    if (this.sorted.id) {
      this.sort(this.sorted.id, this.sorted.order)
    }
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
    console.log('Server sorting would be implemented here')
  }

  sortData(field, order) {
    const column = this.headerConfig.find(item => item.id === field)
    
    if (!column || !column.sortable) {
      return this.data
    }

    const direction = order === 'asc' ? 1 : -1
    const data = [...this.data]

    if (column.sortType === 'custom' && column.sortFunction) {
      return data.sort((a, b) => direction * column.sortFunction(a[field], b[field]))
    }

    return data.sort((a, b) => {
      const aValue = a[field]
      const bValue = b[field]

      switch (column.sortType) {
        case 'number':
          return direction * (aValue - bValue)
        case 'string':
        default:
          return direction * aValue.localeCompare(bValue, ['ru', 'en'], { 
            caseFirst: 'upper' 
          })
      }
    })
  }

  updateTableHeader() {
    const headerCells = this.headerConfig.map(column => this.getHeaderCell(column)).join('')
    this.subElements.header.innerHTML = headerCells
    
    this.subElements.header = this.element.querySelector('[data-element="header"]')
  }

  getHeaderCell(column) {
    const order = this.sorted.id === column.id ? this.sorted.order : ''
    const hasArrow = this.sorted.id === column.id

    return `
      <div class="sortable-table__cell" data-id="${column.id}" data-sortable="${column.sortable}" data-order="${order}">
        <span>${column.title}</span>
        ${column.sortable ? this.getSortArrow(hasArrow) : ''}
      </div>
    `
  }

  getSortArrow(show = false) {
    return show ? `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>
    ` : ''
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

  destroy() {
    super.destroy()
    this.subElements.header.removeEventListener('pointerdown', this.onSortClick)
  }
}