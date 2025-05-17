import { Component, inject } from "@angular/core"
import { CarritoService } from "../../services/carrito.service"
import type { Producto } from "../../interfaces/producto"
import { IMAGES_PRODUCTOS, WSP_LINK } from "../../constants"
import { CommonModule } from "@angular/common"
import { ContadorCantidadComponent } from "../contador-cantidad/contador-cantidad.component"
import { RouterModule } from "@angular/router"
import { ClipboardService } from "ngx-clipboard"
import Swal from "sweetalert2"
import { ElegirMonedaComponent } from "../elegir-moneda/elegir-moneda.component"
import { ProductosService } from "../../services/productos.service"

@Component({
  selector: "app-carrito",
  standalone: true,
  imports: [CommonModule, ContadorCantidadComponent, RouterModule, ElegirMonedaComponent],
  templateUrl: "./carrito.component.html",
  styleUrl: "./carrito.component.css",
})
export class CarritoComponent {
  carritoService = inject(CarritoService)
  productsService = inject(ProductosService)
  clipboard = inject(ClipboardService)
  url: string = IMAGES_PRODUCTOS

  getImage(producto: Producto) {
      const image = producto.image_name!
      return this.url + image
  }

  fullDescription(producto: Producto) {
    if (producto.codigo) {
      return producto.descripcion + " -" + producto.codigo
    }
    return producto.descripcion
  }

  // Método para obtener el porcentaje de descuento de un producto
  getDescuentoPorcentaje(producto: Producto): number {
    const valorDescuento = this.productsService.getValorDescuento(producto)
    return valorDescuento ? Math.round(valorDescuento * 100) : 0
  }

  enviarPedido() {
    let pedido = ""
    for (let i = 0; i < this.carritoService.getItems().length; i++) {
      const item = this.carritoService.getItems()[i]
      pedido += `- ${item.cantidad} ${item.cantidad > 9 ? "*" : " *"} ${this.fullDescription(item.producto)} \$${item.importe}\n`
    }
    const mensaje = `
Hola!, quiero hacer el siguiente pedido:
${pedido}

Total: \$${this.carritoService.getImporte(true)}
Espero su respuesta. Muchas gracias!
`
    this.clipboard.copyFromContent(mensaje)
    Swal.fire({
      title: "El pedido ha sido copiado al portapapeles!\nDesea enviarlo ahora?",
      showDenyButton: true,
      confirmButtonText: "Enviar",
      denyButtonText: `Más tarde`,
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        const link = `${WSP_LINK}?text=${encodeURI(mensaje)}`
        window.open(link, "_blank")
      } else if (result.isDenied) {
        Swal.fire("El pedido no se ha enviado", "", "info")
      }
    })
  }

  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement
    imgElement.src = "/descargar.jpg" // Imagen por defecto
    // Opcional: Evitar bucles infinitos si la imagen por defecto también falla
    imgElement.onerror = null
  }
}
