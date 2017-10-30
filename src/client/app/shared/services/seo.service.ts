import { Injectable } from '@angular/core'
import { Meta, Title } from '@angular/platform-browser'

export interface SEONode {
  title?: string
  description?: string
  img?: SEOImage
  type?: string
  url?: string
  locale?: string
  facebookAppId?: string
}

export interface SEOImage {
  url: string
  alt?: string
  type?: string
  height?: string
  width?: string
}

@Injectable()
export class SEOService {
  constructor(private title: Title, private meta: Meta) { }

  updateNode(node: SEONode) {
    if (node.title) this.updateTitle(node.title)
    if (node.description) this.updateDescription(node.description)
    if (node.img) this.updateImg(node.img)
    if (node.title) this.updateType(node.type)
    if (node.url) this.updateUrl(node.url)
    if (node.title) this.updateLocale(node.locale)
    if (node.facebookAppId) this.updateFbAppId(node.facebookAppId)
  }

  updateTitle(title: string) {
    this.title.setTitle(title)
    this.meta.updateTag(this.createOgTag('title', title))
  }

  updateDescription(desc: string) {
    this.meta.updateTag({ name: 'description', content: desc })
    this.meta.updateTag(this.createOgTag('description', desc))
  }

  updateFbAppId(id: string) {
    this.meta.updateTag({ property: 'fb:app_id', content: id })
  }

  updateImg(img: SEOImage) {
    this.meta.updateTag(this.createOgTag('image', img.url))
    if (img.width) this.meta.updateTag(this.createOgTag('image', img.width, 'width'))
    if (img.height) this.meta.updateTag(this.createOgTag('image', img.height, 'height'))
    if (img.type) this.meta.updateTag(this.createOgTag('image', img.type, 'type'))
    if (img.alt) this.meta.updateTag(this.createOgTag('image', img.alt, 'alt'))
  }

  updateType(type = 'website') {
    this.meta.updateTag(this.createOgTag('type', type))
  }

  updateLocale(locale = 'en_US') {
    this.meta.updateTag(this.createOgTag('locale', locale))
  }

  updateUrl(url: string) {
    this.meta.updateTag(this.createOgTag('url', url))
  }

  createOgTag(property: string, content: string, property2?: string) {
    return {
      property: property2 ? `og:${property}:${property2}` : `og:${property}`,
      content
    }
  }
}
