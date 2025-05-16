import { Directive, ElementRef, HostListener, Input } from "@angular/core"

@Directive({
  selector: "img[appImgFallback]",
  standalone: true,
})
export class ImgFallbackDirective {
  @Input() appImgFallback = "/descargar.jpg"

  constructor(private el: ElementRef) {}

  @HostListener("error")
  onError() {
    const imgElement = this.el.nativeElement as HTMLImageElement
    imgElement.src = this.appImgFallback
    // Evitar bucles infinitos si la imagen por defecto también falla
    imgElement.onerror = null
  }
}
