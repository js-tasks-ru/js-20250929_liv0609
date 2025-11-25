import escapeHtml from './utils/escape-html.js'
import fetchJson from './utils/fetch-json.js'
import SortableList from '../../08-forms-fetch-api-part-2/1-product-form-v1/index.js'

const IMGUR_CLIENT_ID = '28aaa2e823b03b1'
const BACKEND_URL = 'https://course-js.javascript.ru'

export default class ProductForm {
  element
  subElements = {}
  defaultFormData = {
    title: '',
    description: '',
    quantity: 1,
    subcategory: '',
    status: 1,
    price: 100,
    discount: 0,
    images: []
  }

  onSubmit = event => {
    event.preventDefault()
    this.save()
  }

  uploadImage = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'

    fileInput.onchange = async () => {
      const [file] = fileInput.files

      if (file) {
        const formData = new FormData()
        formData.append('image', file)

        try {
          const result = await fetchJson('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
              Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
            },
            body: formData,
            referrer: ''
          })

          const image = {
            url: result.data.link,
            source: file.name
          }

          this.addImage(image)
        } catch (error) {
          console.error('Error uploading image:', error)
        }
      }
    }

    fileInput.click()
  }

  constructor(productId) {
    this.productId = productId
  }

  async render() {
    const categoriesPromise = this.loadCategoriesList()
    const productPromise = this.productId ? this.loadProductData(this.productId) : Promise.resolve([this.defaultFormData])

    const [categoriesData, productResponse] = await Promise.all([categoriesPromise, productPromise])
    const [productData] = productResponse

    this.categories = categoriesData
    this.data = productData

    this.renderForm()

    if (this.data) {
      this.setFormData()
      this.initEventListeners()
    }

    return this.element
  }

  async loadCategoriesList() {
    return await fetchJson(`${BACKEND_URL}/api/rest/categories?_sort=weight&_refs=subcategory`)
  }

  async loadProductData(productId) {
    return await fetchJson(`${BACKEND_URL}/api/rest/products?id=${productId}`)
  }

  renderForm() {
    const element = document.createElement('div')
    element.innerHTML = this.getTemplate()
    this.element = element.firstElementChild
    this.subElements = this.getSubElements(this.element)
  }

  getTemplate() {
    return `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">
          ${this.getFormFields()}
        </form>
      </div>
    `
  }

  getFormFields() {
    return `
      <div class="form-group form-group__half_left">
        <fieldset>
          <label class="form-label">Название товара</label>
          <input required="" type="text" id="title" name="title" class="form-control" placeholder="Название товара">
        </fieldset>
      </div>
      <div class="form-group form-group__wide">
        <label class="form-label">Описание</label>
        <textarea required="" class="form-control" id="description" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
      </div>
      <div class="form-group form-group__wide" data-element="sortable-list-container">
        <label class="form-label">Фото</label>
        <div data-element="imageListContainer">
          ${this.getImagesList()}
        </div>
        <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
      </div>
      <div class="form-group form-group__half_left">
        <label class="form-label">Категория</label>
        <select class="form-control" id="subcategory" name="subcategory">
          ${this.getCategoriesOptions()}
        </select>
      </div>
      <div class="form-group form-group__half_left form-group__two-col">
        <fieldset>
          <label class="form-label">Цена ($)</label>
          <input required="" type="number" id="price" name="price" class="form-control" placeholder="100">
        </fieldset>
        <fieldset>
          <label class="form-label">Скидка ($)</label>
          <input required="" type="number" id="discount" name="discount" class="form-control" placeholder="0">
        </fieldset>
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Количество</label>
        <input required="" type="number" class="form-control" id="quantity" name="quantity" placeholder="1">
      </div>
      <div class="form-group form-group__part-half">
        <label class="form-label">Статус</label>
        <select class="form-control" id="status" name="status">
          <option value="1">Активен</option>
          <option value="0">Неактивен</option>
        </select>
      </div>
      <div class="form-buttons">
        <button type="submit" name="save" class="button-primary-outline">
          Сохранить товар
        </button>
      </div>
    `
  }

  getCategoriesOptions() {
    return this.categories.map(category => {
      return category.subcategories.map(subcategory => {
        return `
          <option value="${subcategory.id}">${escapeHtml(category.title)} > ${escapeHtml(subcategory.title)}</option>
        `
      }).join('')
    }).join('')
  }

  getImagesList() {
    if (!this.data.images || this.data.images.length === 0) {
      return '<ul class="sortable-list"></ul>'
    }

    return `
      <ul class="sortable-list">
        ${this.data.images.map(image => this.getImageItem(image)).join('')}
      </ul>
    `
  }

  getImageItem(image) {
    return `
      <li class="products-edit__imagelist-item sortable-list__item">
        <input type="hidden" name="url" value="${escapeHtml(image.url)}">
        <input type="hidden" name="source" value="${escapeHtml(image.source)}">
        <span>
          <img src="icon-grab.svg" data-grab-handle alt="grab">
          <img class="sortable-table__cell-img" alt="${escapeHtml(image.source)}" src="${escapeHtml(image.url)}">
          <span>${escapeHtml(image.source)}</span>
        </span>
        <button type="button">
          <img src="icon-trash.svg" data-delete-handle alt="delete">
        </button>
      </li>
    `
  }

  setFormData() {
    const { productForm } = this.subElements
    const fields = Object.keys(this.defaultFormData).filter(item => item !== 'images')

    fields.forEach(field => {
      const element = productForm.querySelector(`[name="${field}"]`)
      if (element) {
        element.value = this.data[field] || this.defaultFormData[field]
      }
    })
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]')
    const result = {}

    for (const subElement of elements) {
      const name = subElement.dataset.element
      result[name] = subElement
    }

    return result
  }

  initEventListeners() {
    const { productForm, imageListContainer } = this.subElements

    productForm.addEventListener('submit', this.onSubmit)

    const uploadImageButton = productForm.querySelector('button[name="uploadImage"]')
    uploadImageButton.addEventListener('click', this.uploadImage)

    imageListContainer.addEventListener('click', event => {
      if (event.target.closest('[data-delete-handle]')) {
        event.target.closest('li').remove()
      }
    })
    
    this.initSortableList()
  }

  initSortableList() {
    const { imageListContainer } = this.subElements
    const sortableListElement = imageListContainer.querySelector('.sortable-list')

    if (sortableListElement) {
      this.sortableList = new SortableList({
        element: sortableListElement,
        handleSelector: '[data-grab-handle]',
        deleteSelector: '[data-delete-handle]'
      })
    }
  }

  addImage(image) {
    const imageList = this.subElements.imageListContainer.querySelector('.sortable-list')
    
    if (!this.sortableList) {
      this.initSortableList()
    }

    const imageItem = document.createElement('div')
    imageItem.innerHTML = this.getImageItem(image)
    
    if (this.sortableList) {
      this.sortableList.addItem(imageItem.firstElementChild)
    } else {
      imageList.append(imageItem.firstElementChild)
    }
  }

  getFormData() {
    const { imageListContainer } = this.subElements
    const excludedFields = ['url', 'source']
    const fields = Object.keys(this.defaultFormData).filter(item => !excludedFields.includes(item))
    const values = {}

    for (const field of fields) {
      values[field] = this.getFieldValue(field)
    }

    const imagesHTMLCollection = imageListContainer.querySelectorAll('.sortable-list__item')
    values.images = []

    for (const imageItem of imagesHTMLCollection) {
      const url = imageItem.querySelector('input[name="url"]').value
      const source = imageItem.querySelector('input[name="source"]').value

      values.images.push({
        url,
        source
      })
    }

    if (this.productId) {
      values.id = this.productId
    }

    return values
  }

  getFieldValue(fieldName) {
    const element = this.subElements.productForm.querySelector(`[name="${fieldName}"]`)

    if (!element) {
      return ''
    }

    switch (element.type) {
      case 'number':
        return parseInt(element.value) || 0
      case 'select-one':
        return element.value
      default:
        return element.value
    }
  }

  async save() {
    const formData = this.getFormData()

    try {
      const result = await fetchJson(`${BACKEND_URL}/api/rest/products`, {
        method: this.productId ? 'PATCH' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      this.dispatchEvent(result)
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  dispatchEvent(result) {
    const eventType = this.productId ? 'product-updated' : 'product-saved'
    this.element.dispatchEvent(new CustomEvent(eventType, {
      detail: result
    }))
  }

  remove() {
    this.element && this.element.remove()
  }

  destroy() {
    this.remove()
    
    if (this.sortableList) {
      this.sortableList.destroy()
    }
    
    this.subElements = {}
  }
}