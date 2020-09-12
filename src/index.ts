export default class FaviconBadge {
  constructor(private options: { crossOrigin?: boolean } = {}) {}

  private r = Math.ceil(window.devicePixelRatio) || 1
  private size = 16 * this.r
  private width = 7
  private height = 9
  private background = 'red'
  private font = 10 * this.r + 'px arial'

  private canvas: HTMLCanvasElement = this.getCanvas()
  private currentFavicon: string | null = null
  private originalFavicon: string | null = null

  private agent = navigator.userAgent.toLowerCase()

  private browser = {
    ie: this.ua('trident'),
    chrome: this.ua('chrome'),
    webkit: this.ua('chrome') || this.ua('safari'),
    safari: this.ua('safari') && !this.ua('chrome'),
    mozilla: this.ua('mozilla') && !this.ua('chrome') && !this.ua('safari'),
  }

  private ua(browser: string) {
    return this.agent.indexOf(browser) !== -1
  }

  private getCanvas() {
    if (this.canvas) {
      return this.canvas
    }
    const canvas = document.createElement('canvas')
    canvas.width = this.size
    canvas.height = this.size
    return canvas
  }

  private getCurrentFavicon() {
    if (!this.originalFavicon || !this.currentFavicon) {
      const tag = this.getFaviconTag()
      this.currentFavicon = tag ? tag.getAttribute('href') : '/favicon.ico'
      if (!this.originalFavicon) {
        this.originalFavicon = this.currentFavicon
      }
    }
    return this.currentFavicon
  }

  private getFaviconTag() {
    const links = document.getElementsByTagName('link')
    for (let i = 0; i < links.length; i++) {
      if ((links[i].getAttribute('rel') || '').match(/\bicon\b/i)) {
        return links[i]
      }
    }
    return false
  }

  private removeFaviconTag() {
    const links = document.getElementsByTagName('link')
    for (let i = 0, len = links.length; i < len; i++) {
      const exists = typeof links[i] !== 'undefined'
      if (exists && (links[i].getAttribute('rel') || '').match(/\bicon\b/i)) {
        links[i].parentNode!.removeChild(links[i])
      }
    }
  }

  private setFaviconTag(url: string) {
    if (url) {
      this.removeFaviconTag()
      const link = document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'icon'
      link.href = url
      document.getElementsByTagName('head')[0].appendChild(link)
    }
  }

  private refreshFavicon() {
    if (!this.canvas) {
      return
    }
    this.setFaviconTag(this.canvas.toDataURL())
  }

  private drawBubble(label: string, color: string) {
    // bubble needs to be larger for double digits
    const context = this.canvas.getContext('2d')!
    const len = label.length - 1
    const r = this.r

    const width = this.width * r + 6 * r * len
    const height = this.height * r

    const top = this.size - height
    const left = this.size - width - r
    const bottom = 16 * r
    const right = 16 * r
    const radius = 2 * r

    // webkit seems to render fonts lighter than firefox
    context.font = (this.browser.webkit ? 'bold ' : '') + this.font
    context.fillStyle = this.background
    context.strokeStyle = this.background
    context.lineWidth = r

    // bubble
    context.beginPath()
    context.moveTo(left + radius, top)
    context.quadraticCurveTo(left, top, left, top + radius)
    context.lineTo(left, bottom - radius)
    context.quadraticCurveTo(left, bottom, left + radius, bottom)
    context.lineTo(right - radius, bottom)
    context.quadraticCurveTo(right, bottom, right, bottom - radius)
    context.lineTo(right, top + radius)
    context.quadraticCurveTo(right, top, right - radius, top)
    context.closePath()
    context.fill()

    // bottom shadow
    context.beginPath()
    context.strokeStyle = 'rgba(0,0,0,0.3)'
    context.moveTo(left + radius / 2.0, bottom)
    context.lineTo(right - radius / 2.0, bottom)
    context.stroke()

    // label
    context.fillStyle = color
    context.textAlign = 'right'
    context.textBaseline = 'top'

    // unfortunately webkit/mozilla are a pixel different in text positioning
    context.fillText(label, r === 2 ? 29 : 15, this.browser.mozilla ? 7 * r : 6 * r)
  }

  public draw(label: string, color = '#ffffff') {
    const context = this.canvas.getContext('2d')!

    const faviconImage = new Image()
    faviconImage.addEventListener(
      'load',
      () => {
        context.clearRect(0, 0, this.size, this.size)
        context.drawImage(faviconImage, 0, 0, faviconImage.width, faviconImage.height, 0, 0, this.size, this.size)
        if (label.length > 0) {
          this.drawBubble(label, color)
        }
        this.refreshFavicon()
      },
      false
    )

    const src = this.getCurrentFavicon() || ''
    if (!src.match(/^data/) && this.options.crossOrigin) {
      faviconImage.crossOrigin = 'anonymous'
    }
    faviconImage.src = src
  }

  public reset() {
    this.currentFavicon = this.originalFavicon
    this.setFaviconTag(this.originalFavicon || '')
  }
}
