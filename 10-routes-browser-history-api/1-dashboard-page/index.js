import RangePicker from './components/range-picker/src/index.js'
import SortableTable from './components/sortable-table/src/index.js'
import ColumnChart from './components/column-chart/src/index.js'
import header from './bestsellers-header.js'

import fetchJson from './utils/fetch-json.js'

const BACKEND_URL = 'https://course-js.javascript.ru/'

export default class Page {
  element
  subElements = {}
  components = {}

  async render() {
    const element = document.createElement('div')
    element.innerHTML = this.getTemplate()
    this.element = element.firstElementChild
    this.subElements = this.getSubElements(this.element)

    await this.initComponents()
    this.renderComponents()
    this.initEventListeners()

    return this.element
  }

  getTemplate() {
    return `
      <div class="dashboard">
        <div class="content__top-panel">
          <h2 class="page-title">Dashboard</h2>
          <div data-element="rangePicker"></div>
        </div>
        <div data-element="chartsRoot" class="dashboard__charts">
          <div data-element="ordersChart" class="dashboard__chart_orders"></div>
          <div data-element="salesChart" class="dashboard__chart_sales"></div>
          <div data-element="customersChart" class="dashboard__chart_customers"></div>
        </div>
        <h3 class="block-title">Best sellers</h3>
        <div data-element="sortableTable"></div>
      </div>
    `
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]')
    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement
      return accum
    }, {})
  }

  async initComponents() {
    const now = new Date()
    const to = new Date()
    const from = new Date(now.setMonth(now.getMonth() - 1))

    this.components.rangePicker = new RangePicker({
      from,
      to
    })

    this.components.ordersChart = new ColumnChart({
      label: 'orders',
      link: '/sales',
      formatHeading: data => data,
      url: 'api/dashboard/orders',
      range: { from, to }
    })

    this.components.salesChart = new ColumnChart({
      label: 'sales',
      formatHeading: data => `$${data}`,
      url: 'api/dashboard/sales',
      range: { from, to }
    })

    this.components.customersChart = new ColumnChart({
      label: 'customers',
      formatHeading: data => data,
      url: 'api/dashboard/customers',
      range: { from, to }
    })

    try {
      this.components.sortableTable = new SortableTable(header, {
        url: 'api/dashboard/bestsellers',
        isSortLocally: true,
        sorted: {
          id: 'quantity',
          order: 'desc'
        }
      })

      await this.components.sortableTable.render()
    } catch (error) {
      console.error('Failed to initialize sortable table:', error)
      this.components.sortableTable = this.createEmptyTable()
    }
  }

  createEmptyTable() {
    const element = document.createElement('div')
    element.innerHTML = `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${header.map(item => `
            <div class="sortable-table__cell" data-id="${item.id}" data-sortable="${item.sortable}">
              <span>${item.title}</span>
            </div>
          `).join('')}
        </div>
        <div data-element="body" class="sortable-table__body">
          <div class="sortable-table__empty-placeholder">
            No data available
          </div>
        </div>
      </div>
    `

    const table = {
      element: element.firstElementChild,
      destroy: () => {
        if (element.firstElementChild) {
          element.firstElementChild.remove()
        }
      }
    }

    return table
  }

  renderComponents() {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component]
      const { element } = this.components[component]

      root.innerHTML = ''
      if (element) {
        root.append(element)
      }
    })
  }

  initEventListeners() {
    const { rangePicker } = this.components

    if (rangePicker && rangePicker.element) {
      rangePicker.element.addEventListener('date-select', event => {
        const { from, to } = event.detail
        this.updateComponents(from, to)
      })
    }
  }

  async updateComponents(from, to) {
    try {
      const chartsUpdatePromises = [
        this.safeChartUpdate(this.components.ordersChart, from, to),
        this.safeChartUpdate(this.components.salesChart, from, to),
        this.safeChartUpdate(this.components.customersChart, from, to)
      ]

      const bestsellersPromise = this.safeBestsellersUpdate(from, to)

      await Promise.all([...chartsUpdatePromises, bestsellersPromise])

    } catch (error) {
      console.error('Error updating components:', error)
    }
  }

  async safeChartUpdate(chart, from, to) {
    if (!chart || !chart.update) return

    try {
      await chart.update(from, to)
    } catch (error) {
      console.error(`Failed to update chart:`, error)
    }
  }

  async safeBestsellersUpdate(from, to) {
    if (!this.components.sortableTable || !this.components.sortableTable.addRows) return

    try {
      const url = new URL('api/dashboard/bestsellers', BACKEND_URL)
      url.searchParams.set('from', from.toISOString())
      url.searchParams.set('to', to.toISOString())
      url.searchParams.set('_sort', 'quantity')
      url.searchParams.set('_order', 'desc')
      url.searchParams.set('_start', '0')
      url.searchParams.set('_end', '30')

      const bestsellersData = await fetchJson(url.toString())
      this.components.sortableTable.addRows(bestsellersData)
    } catch (error) {
      console.error('Failed to update bestsellers:', error)

      if (this.components.sortableTable.subElements && this.components.sortableTable.subElements.body) {
        this.components.sortableTable.subElements.body.innerHTML = `
          <div class="sortable-table__empty-placeholder">
            Failed to load data
          </div>
        `
      }
    }
  }

  remove() {
    this.element && this.element.remove()
  }

  destroy() {
    this.remove()

    Object.values(this.components).forEach(component => {
      if (component && typeof component.destroy === 'function') {
        component.destroy()
      }
    })

    this.components = {}
    this.subElements = {}
  }
}