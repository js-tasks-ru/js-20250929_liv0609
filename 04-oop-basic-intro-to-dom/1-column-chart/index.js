export default class ColumnChart {
    chartHeight = 50

    constructor(conf) {
        this.data = conf?.data || []
        this.label = conf?.label || ''
        this.value = conf?.value || 0
        this.link = conf?.link || ''
        this.formatHeading = conf?.formatHeading || (data => data)

        this.build()
    }

    build() {
        const element = document.createElement('div')
        element.innerHTML = this._generateTemplate()
        this.element = element.firstElementChild
    }

    update(data = []) {
        this.data = data

        const body = this.element.querySelector('[data-element="body"]')
        body.innerHTML = this._getColumns(data)

        data.length ?
            this.element.classList.remove('column-chart_loading') :
            this.element.classList.add('column-chart_loading')
    }

    remove() {
        this.element && this.element.remove()
    }

    destroy() {
        this.remove()
        this.element = null // можно и не обнулять, сборщик сам разберется
    }

    _generateTemplate() {
        return `
        <div class="column-chart column-chart_loading" style="--chart-height: 50">
            <div class="column-chart__title">
                ${this.label} ${this._getLink()}
                <a class="column-chart__link" href="">View all</a>
            </div>
            <div class="column-chart__container">
                <div data-element="header" class="column-chart__header">
                    ${this.formatHeading(this.value)}
                </div>
                <div data-element="body" class="column-chart__chart">
                    ${this._getColumns(this.data)}
                </div>
            </div>
        </div>`
    }

    _getLink() {
        return this.link ?
            `<a href="${this.link}" class="column-chart__link">View all</a>` : ''
    }

    _getColumns(data) {
        if (!data.length) return ''

        const maxValue = Math.max(...data)
        const scale = this.chartHeight / maxValue

        return data.map(item => {
            const value = String(Math.floor(item * scale))
            const percent = `${(item / maxValue * 100).toFixed(0)}%`

            return `<div style="--value: ${value}" data-tooltip="${percent}"></div>`
        }).join('')
    }
}
