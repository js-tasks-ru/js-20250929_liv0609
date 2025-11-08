export default class NotificationMessage {

  static activeNotification = null

  constructor(text, props) {
    this.text = text ? text : 'Hello world!'
    this.duration = props?.duration && !!props?.duration
      ? props.duration : 1000
    this.type = props?.type && ['success', 'error'].includes(props?.type)
      ? props.type : 'success'

    this.render()
  }

  get durationInSeconds() {
    return this.duration / 1000
  }

  render() {
    const element = document.createElement('div')

    element.innerHTML = `
            <div class="notification ${this.type}" style="--value:${this.durationInSeconds}s">
                <div class="timer"></div>
                <div class="inner-wrapper">
                    <div class="notification-header">${this.type}</div>
                    <div class="notification-body">
                        ${this.text}
                    </div>
                </div>
            </div>
          `

    this.element = element.firstElementChild
  }

  show(parent = document.body) {
    NotificationMessage.activeNotification &&
      NotificationMessage.activeNotification.destroy()

    NotificationMessage.activeNotification = this

    parent.append(this.element)

    this.timerId = setTimeout(() => {
      this.destroy()
    }, this.duration)
  }

  remove() {
    this.element && this.element.remove()
  }

  destroy() {
    this.remove()

    this.timerId && clearTimeout(this.timerId)

    if (NotificationMessage.activeNotification === this) {
      NotificationMessage.activeNotification = null
    }
  }
}