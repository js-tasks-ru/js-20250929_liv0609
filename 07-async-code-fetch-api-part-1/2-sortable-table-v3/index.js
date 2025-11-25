import SortableTable from '../../06-events-practice/1-sortable-table-v2/index.js'
import fetchJson from './utils/fetch-json.js'

const BACKEND_URL = 'https://course-js.javascript.ru'

export default class ExtendsSortableTable extends SortableTable {
  loading = false
  isInitialLoad = true
  start = 0
  step = 20
  end = this.start + this.step

  constructor(
    headerConfig = [],
    {
      url = '',
      data = [],
      sorted = {
        id: headerConfig.find(item => item.sortable)?.id,
        order: 'asc'
      },
      isSortLocally = false,
      start = 0,
      step = 20,
      end = start + step
    } = {}
  ) {
    super(headerConfig, { data, sorted, isSortLocally })
    
    this.url = new URL(url, BACKEND_URL)
    this.start = start
    this.step = step
    this.end = end

    this.createLoader()
    this.createEmptyPlaceholder()

    this.render()
  }

  async render() {
    if (this.isInitialLoad) {
      const data = await this.loadData()
      this.data = data
      this.isInitialLoad = false
    }

    super.render()
    
    if (this.sorted.id && !this.isSortLocally) {
      await this.sort(this.sorted.id, this.sorted.order)
    }

    this.initEventListeners()
  }

  createLoader() {
    if (!this.subElements.loading) {
      const loadingElement = document.createElement('div')
      loadingElement.innerHTML = this.getLoadingTemplate()
      this.element.append(loadingElement.firstElementChild)
      this.subElements.loading = this.element.querySelector('[data-element="loading"]')
    }
  }

  createEmptyPlaceholder() {
    if (!this.subElements.emptyPlaceholder) {
      const emptyElement = document.createElement('div')
      emptyElement.innerHTML = this.getEmptyPlaceholder()
      this.element.append(emptyElement.firstElementChild)
      this.subElements.emptyPlaceholder = this.element.querySelector('[data-element="emptyPlaceholder"]')
    }
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

  async loadData(id = this.sorted.id, order = this.sorted.order, start = this.start, end = this.end) {
    this.url.searchParams.set('_sort', id)
    this.url.searchParams.set('_order', order)
    this.url.searchParams.set('_start', start)
    this.url.searchParams.set('_end', end)

    try {
      this.showLoading()
      const data = await fetchJson(this.url)
      
      if (data.length === 0) {
        this.showEmptyPlaceholder()
      } else {
        this.hideEmptyPlaceholder()
      }
      
      return data
    } catch (error) {
      console.error('Error loading data:', error)
      this.showError('Failed to load data')
      return []
    } finally {
      this.hideLoading()
    }
  }

  async sortOnServer(field, order) {
    if (!this.isSortable(field)) return

    this.sorted = { id: field, order }
    
    this.start = 0
    this.end = this.start + this.step
    
    const sortedData = await this.loadData(field, order, this.start, this.end)
    this.data = sortedData
    
    this.updateTableHeader()
    this.updateTableBody(sortedData)
  }

  async loadMore() {
    if (this.loading || this.isSortLocally) return

    this.start = this.end
    this.end = this.start + this.step

    const moreData = await this.loadData(this.sorted.id, this.sorted.order, this.start, this.end)
    
    if (moreData.length > 0) {
      this.data = [...this.data, ...moreData]
      this.subElements.body.insertAdjacentHTML('beforeend', this.getTableRows(moreData))
    }
    
    if (moreData.length < this.step) {
      this.removeScrollListener()
    }
  }

  getTableRows(data) {
    return data.map(item => {
      return `
        <a href="/products/${item.id}" class="sortable-table__row">
          ${this.headerConfig.map(column => {
            const cellContent = column.template 
              ? column.template(item[column.id])
              : `<div class="sortable-table__cell">${item[column.id]}</div>`
            return cellContent
          }).join('')}
        </a>
      `
    }).join('')
  }

  initEventListeners() {
    super.initEventListeners()
    
    if (!this.isSortLocally) {
      this.addScrollListener()
    }
  }

  onWindowScroll = async () => {
    const { bottom } = this.element.getBoundingClientRect()
    const { clientHeight } = document.documentElement

    if (bottom < clientHeight && !this.loading && !this.isSortLocally) {
      await this.loadMore()
    }
  }

  addScrollListener() {
    window.addEventListener('scroll', this.onWindowScroll)
  }

  removeScrollListener() {
    window.removeEventListener('scroll', this.onWindowScroll)
  }

  showLoading() {
    this.loading = true
    this.element.classList.add('sortable-table_loading')
    if (this.subElements.loading) {
      this.subElements.loading.style.display = 'block'
    }
  }

  hideLoading() {
    this.loading = false
    this.element.classList.remove('sortable-table_loading')
    if (this.subElements.loading) {
      this.subElements.loading.style.display = 'none'
    }
  }

  showEmptyPlaceholder() {
    this.element.classList.add('sortable-table_empty')
    if (this.subElements.emptyPlaceholder) {
      this.subElements.emptyPlaceholder.style.display = 'flex'
    }
  }

  hideEmptyPlaceholder() {
    this.element.classList.remove('sortable-table_empty')
    if (this.subElements.emptyPlaceholder) {
      this.subElements.emptyPlaceholder.style.display = 'none'
    }
  }

  showError(message) {
    console.error(message)
  }

  destroy() {
    super.destroy()
    this.removeScrollListener()
  }
}