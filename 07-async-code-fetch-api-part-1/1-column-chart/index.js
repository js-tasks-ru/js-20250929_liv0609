import fetchJson from './utils/fetch-json.js'

const BACKEND_URL = 'https://course-js.javascript.ru'

export default class ColumnChart {
  chartHeight = 50
  subElements = {}

  constructor({
    url = '',
    range = {},
    label = '',
    link = '',
    value = 0,
    formatHeading = data => data
  } = {}) {
    this.url = new URL(url, BACKEND_URL)
    this.range = range
    this.label = label
    this.link = link
    this.value = value
    this.formatHeading = formatHeading
    this.data = []

    this.render()
  }

  render() {
    const element = document.createElement('div')
    element.innerHTML = this.getTemplate()
    this.element = element.firstElementChild

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
        this.subElements.header.textContent = this.formatHeading(
          this.data.reduce((sum, current) => sum + current, 0)
        )
        this.subElements.body.innerHTML = this.getColumns(this.data)
        this.element.classList.remove('column-chart_loading')
      }

      return data
    } catch (error) {
      console.error('Error loading data:', error)
      return {}
    }
  }

  async update(from, to) {
    return await this.loadData(from, to)
  }

  getTemplate() {
    return `
      <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          ${this.label}
          ${this.getLink()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">
            ${this.formatHeading(this.value)}
          </div>
          <div data-element="body" class="column-chart__chart">
            ${this.getColumns(this.data)}
          </div>
        </div>
      </div>
    `
  }

  getLink() {
    return this.link
      ? `<a href="${this.link}" class="column-chart__link">View all</a>`
      : ''
  }

  getColumns(data) {
    if (!data || !data.length) return ''

    const maxValue = Math.max(...data)
    const scale = this.chartHeight / maxValue

    return data
      .map(item => {
        const value = String(Math.floor(item * scale))
        const percent = ((item / maxValue) * 100).toFixed(0)

        return `<div style="--value: ${value}" data-tooltip="${percent}%"></div>`
      })
      .join('')
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

  remove() {
    this.element && this.element.remove()
  }

  destroy() {
    this.remove()
    this.element = null
    this.subElements = {}
  }
}