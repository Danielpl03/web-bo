import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(
    @Inject(DOCUMENT) private _document: Document,
    public title: Title,
    public meta: Meta) { }

    setCanonicalUrl(url?: string){
      const canUrl= url ==undefined ? this._document.URL : url;
      const head = this._document.getElementsByTagName('head')[0];
      let element: HTMLLinkElement | null = this._document.querySelector(`link[rel='canonical']`)
      if(!element){
        element = this._document.createElement('link') as HTMLLinkElement;
        head.appendChild(element);
      }
      element.setAttribute('rel', 'canonical');
      element.setAttribute('href', canUrl);
    }

    setIndexFollow(state: boolean = true){
      this.meta.updateTag({ name:'robots', content:state ? "index, follow" : "noindex, nofollow" });
    }
}
