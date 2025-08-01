import { Component, Input, computed, inject } from "@angular/core"
import type { Producto } from "../../interfaces/producto"
import { CommonModule } from "@angular/common"
import { IMAGES_PRODUCTOS, IMAGES_SUPABASE, WSP_LINK } from "../../constants"
import { CarritoService } from "../../services/carrito.service"
import Swal from "sweetalert2"
import { ProductosService } from "../../services/productos.service"


@Component({
  selector: "app-tarjeta-producto",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./tarjeta-producto.component.html",
  styleUrl: "./tarjeta-producto.component.css",
})
export class TarjetaProductoComponent {
  precio = computed(() => {
    // Asegurarse de que el precio se recalcule cuando cambie la moneda
    const monedaActual = this.carritoService.moneda()
    return this.productsService.getPrecio(true, this.producto)
  })

  precioOriginal = computed(() => {
    // Precio sin descuento
    return this.productsService.getPrecio(false, this.producto)
  })

  tieneDescuentoActivo = computed(() => {
    const monedaId = this.carritoService.moneda()?.idMoneda || 1
    const tieneDescuento = this.productsService.productoTieneDescuento(this.producto, monedaId)
    console.log(`Producto ${this.producto.idProducto} tiene descuento activo: ${tieneDescuento}`)
    return tieneDescuento
  })

  porcentajeDescuento = computed(() => {
    const valorDescuento = this.productsService.getValorDescuento(this.producto)
    const porcentaje = valorDescuento ? Math.round(valorDescuento * 100) : 0
    console.log(`Porcentaje de descuento para producto ${this.producto.idProducto}: ${porcentaje}%`)
    return porcentaje
  })

  @Input({ required: true }) producto!: Producto
  localidades: number[] = [102, 103, 105]
  url: string = IMAGES_SUPABASE
  carritoService = inject(CarritoService)
  productsService = inject(ProductosService)

  getImage() {
      const image = this.producto.image_name!
      return this.url + image
  }

  fullDescription() {
    if (this.producto.codigo) {
      return this.producto.descripcion + " -" + this.producto.codigo
    }
    return this.producto.descripcion
  }

  tieneStock(): boolean {
    if (this.producto.stocks) {
      for (let index = 0; index < this.localidades.length; index++) {
        const element = this.producto.stocks[this.localidades[index]]
        if (
          element > 0 ||
          (this.producto.etiquetasProductos != null &&
            this.producto.etiquetasProductos.filter((ep) => ep.idEtiqueta == 7))
        )
          return true
      }
    }
    return false
  }

  informacion() {
    const mensaje = `
Hola!, quisiera más información acerca de ${this.fullDescription()}. Muchas gracias!
`
    const link = `${WSP_LINK}?text=${encodeURI(mensaje)}`
    window.open(link, "_blank")
  }

  agregarACarrito() {
    this.carritoService.agregarACarrito(this.producto)
    Swal.fire({
      position: "top-end",
      width: 300,
      icon: "success",
      title: "El producto se ha agregado correctamente",
      showConfirmButton: false,
      timer: 1000,
    })
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement
    imgElement.src = "/descargar.jpg" // Imagen por defecto
    imgElement.onerror = null
  }
}
