import SortableList from '../2-sortable-list/index.js'
import escapeHtml from './utils/escape-html.js'
import fetchJson from './utils/fetch-json.js'

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

  constructor(productId) {
    this.productId = productId
  }

  async render() {
    const categoriesPromise = this.loadCategoriesList()
    const productPromise = this.productId ? this.loadProductData(this.productId) : Promise.resolve(this.defaultFormData)

    const [categoriesData, productResponse] = await Promise.all([categoriesPromise, productPromise])
    const [productData] = productResponse

    this.categories = categoriesData
    this.data = productData

    this.renderForm()

    if (this.data) {
      this.setFormData()
      this.createImagesList()
      this.initEventListeners()
    }

    return this.element
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
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input required="" type="text" name="title" id="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required="" class="form-control" name="description" id="description" data-element="productDescription" placeholder="Описание товара"></textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer"></div>
            <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
          </div>
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory" id="subcategory">
              ${this.getCategoriesOptions()}
            </select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required="" type="number" name="price" id="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required="" type="number" name="discount" id="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required="" type="number" class="form-control" name="quantity" id="quantity" placeholder="1">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" name="status" id="status">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              ${this.productId ? 'Сохранить товар' : 'Добавить товар'}
            </button>
          </div>
        </form>
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

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]')
    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement
      return accum
    }, {})
  }

  async loadCategoriesList() {
    const url = new URL('api/rest/categories', BACKEND_URL)
    url.searchParams.set('_sort', 'weight')
    url.searchParams.set('_refs', 'subcategory')
    return await fetchJson(url)
  }

  async loadProductData(productId) {
    const url = new URL('api/rest/products', BACKEND_URL)
    url.searchParams.set('id', productId)
    return await fetchJson(url)
  }

  setFormData() {
    const { productForm } = this.subElements
    const excludedFields = ['images']
    const fields = Object.keys(this.defaultFormData).filter(item => !excludedFields.includes(item))

    fields.forEach(field => {
      const element = productForm.querySelector(`#${field}`)
      if (element) {
        element.value = this.data[field] || this.defaultFormData[field]
      }
    })
  }

  createImagesList() {
    const { imageListContainer } = this.subElements
    
    if (!this.data.images) {
      this.data.images = []
    }

    const items = this.data.images.map(({ url, source }) => {
      return this.createImageListItem(url, source)
    })

    this.sortableList = new SortableList({ items })
    imageListContainer.append(this.sortableList.element)
  }

  createImageListItem(url, source) {
    const element = document.createElement('li')
    element.className = 'products-edit__imagelist-item sortable-list__item'
    element.innerHTML = `
      <input type="hidden" name="url" value="${escapeHtml(url)}">
      <input type="hidden" name="source" value="${escapeHtml(source)}">
      <span>
        <img src="icon-grab.svg" data-grab-handle alt="grab">
        <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(url)}">
        <span>${escapeHtml(source)}</span>
      </span>
      <button type="button">
        <img src="icon-trash.svg" data-delete-handle alt="delete">
      </button>
    `
    return element
  }

  initEventListeners() {
    const { productForm, imageListContainer } = this.subElements

    productForm.addEventListener('submit', this.onSubmit)
    imageListContainer.addEventListener('click', this.onUploadImage)
  }

  onSubmit = async (event) => {
    event.preventDefault()
    await this.save()
  }

  onUploadImage = () => {
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'

    fileInput.addEventListener('change', async () => {
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

          const newImage = {
            url: result.data.link,
            source: file.name
          }

          this.data.images.push(newImage)
          this.updateImagesList()
        } catch (error) {
          console.error('Image upload failed:', error)
        }
      }
    })

    fileInput.click()
  }

  updateImagesList() {
    const { imageListContainer } = this.subElements
    imageListContainer.innerHTML = ''
    this.createImagesList()
  }

  getFormData() {
    const { productForm } = this.subElements
    const excludedFields = ['images']
    const formatToNumber = ['price', 'quantity', 'discount', 'status']
    const fields = Object.keys(this.defaultFormData).filter(item => !excludedFields.includes(item))
    const values = {}

    for (const field of fields) {
      values[field] = formatToNumber.includes(field)
        ? parseInt(productForm.querySelector(`#${field}`).value)
        : productForm.querySelector(`#${field}`).value
    }

    const imagesElements = this.sortableList.element.querySelectorAll('.sortable-list__item')
    values.images = []

    for (const imageElement of imagesElements) {
      values.images.push({
        url: imageElement.querySelector('[name="url"]').value,
        source: imageElement.querySelector('[name="source"]').value
      })
    }

    return values
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

      this.dispatchEvent(this.productId ? 'product-updated' : 'product-saved', result)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  dispatchEvent(eventType, detail) {
    this.element.dispatchEvent(new CustomEvent(eventType, {
      detail,
      bubbles: true
    }))
  }

  remove() {
    this.element && this.element.remove()
  }

  destroy() {
    this.remove()
    this.element = null
    this.subElements = {}
    
    if (this.sortableList) {
      this.sortableList.destroy()
    }
  }
}