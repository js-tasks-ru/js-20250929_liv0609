import BaseColumnChart from '../../04-oop-basic-intro-to-dom/1-column-chart/index.js'
import fetchJson from './utils/fetch-json.js'

const BACKEND_URL = 'https://course-js.javascript.ru'

export default class ColumnChart extends BaseColumnChart {
  subElements = {}

  constructor({
    url = '',
    range = {},
    label = '',
    link = '',
    value = 0,
    formatHeading = data => data
  } = {}) {
    super({
      data: [],
      label,
      link,
      value,
      formatHeading
    })
    
    this.url = new URL(url, BACKEND_URL)
    this.range = range
    
    this.initialize()
  }

  initialize() {
    this.subElements = this.getSubElements()
    
    if (this.range.from && this.range.to) {
      this.loadData(this.range.from, this.range.to)
    }
  }

  async loadData(from, to) {
    this.element.classList.add('column-chart_loading')

    this.url.searchParams.set('from', from.toISOString())
    this.url.searchParams.set('to', to.toISOString())

    try {
      const data = await fetchJson(this.url)
      this.data = Object.values(data)

      if (this.data.length) {
        const totalValue = this.data.reduce((sum, current) => sum + current, 0)
        this.subElements.header.textContent = this.formatHeading(totalValue)
        
        super.update(this.data)
      } else {
        this.element.classList.add('column-chart_loading')
      }

      return data
    } catch (error) {
      console.error('Error loading data:', error)
      this.element.classList.add('column-chart_loading')
      return {}
    }
  }

  async update(from, to) {
    if (from && to) {
      return await this.loadData(from, to)
    }
    
    super.update(this.data)
    return this.data
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

  destroy() {
    super.destroy()
    this.subElements = {}
  }
}