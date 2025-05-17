import {
  Component,
  Input,
  type OnInit,
  type OnDestroy,
  type WritableSignal,
  computed,
  inject,
  signal,
} from "@angular/core"
import type { Producto } from "../../interfaces/producto"
import { interval, type Subscription } from "rxjs"
import { IMAGES_PRODUCTOS } from "../../constants"
import { CarritoService } from "../../services/carrito.service"
import { ProductosService } from "../../services/productos.service"
import { CommonModule } from "@angular/common"
import Swal from "sweetalert2"

interface ProductoConTipo extends Producto {
  tipo: "destacado" | "rebajado"
}

@Component({
  selector: "app-producto-carrusel",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./producto-carrusel.component.html",
  styleUrl: "./producto-carrusel.component.css",
})
export class ProductoCarruselComponent implements OnInit, OnDestroy {
  @Input() productosDestacados: Producto[] = []
  @Input() productosRebajados: Producto[] = []
  @Input() titulo = "Productos Destacados y Ofertas"

  // Array combinado de productos con información de su tipo
  productosCombinadosConTipo: ProductoConTipo[] = []

  currentIndex: WritableSignal<number> = signal(0)
  private autoSlideSubscription?: Subscription

  carritoService = inject(CarritoService)
  productsService = inject(ProductosService)

  ngOnInit() {
    // Combinar productos destacados y rebajados en un solo array
    this.combinarProductos()

    // Iniciar autodesplazamiento solo si hay productos
    if (this.productosCombinadosConTipo.length > 0) {
      this.startAutoSlide()
    }

    // Imprimir información de depuración
    console.log("Productos destacados:", this.productosDestacados.length)
    console.log("Productos rebajados:", this.productosRebajados.length)
    console.log("Productos combinados:", this.productosCombinadosConTipo.length)
    console.log(
      "Tipos de productos:",
      this.productosCombinadosConTipo.map((p) => p.tipo),
    )
  }

  ngOnDestroy() {
    if (this.autoSlideSubscription) {
      this.autoSlideSubscription.unsubscribe()
    }
  }

  // Combinar productos destacados y rebajados en un solo array
  combinarProductos() {
    // Limpiar el array combinado
    this.productosCombinadosConTipo = []

    // Agregar productos destacados con su tipo
    if (this.productosDestacados && this.productosDestacados.length > 0) {
      const destacados = this.productosDestacados.map((p) => ({
        ...p,
        tipo: "destacado" as const,
      }))
      this.productosCombinadosConTipo.push(...destacados)
    }

    // Agregar productos rebajados con su tipo
    if (this.productosRebajados && this.productosRebajados.length > 0) {
      const rebajados = this.productosRebajados.map((p) => ({
        ...p,
        tipo: "rebajado" as const,
      }))
      this.productosCombinadosConTipo.push(...rebajados)
    }

    // Mezclar aleatoriamente los productos para variedad
      if (this.productosCombinadosConTipo.length > 0) {
        this.productosCombinadosConTipo = this.mezclarArray(this.productosCombinadosConTipo)
      }
  }

  // Método para mezclar aleatoriamente un array (algoritmo Fisher-Yates)
  mezclarArray<T>(array: T[]): T[] {
    const nuevoArray = [...array]
    for (let i = nuevoArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[nuevoArray[i], nuevoArray[j]] = [nuevoArray[j], nuevoArray[i]]
    }
    return nuevoArray
  }

  startAutoSlide() {
    this.autoSlideSubscription = interval(3000).subscribe(() => {
      this.nextSlide()
    })
  }

  stopAutoSlide() {
    if (this.autoSlideSubscription) {
      this.autoSlideSubscription.unsubscribe()
    }
  }

  nextSlide() {
    if (this.productosCombinadosConTipo.length > 0) {
      this.currentIndex.set((this.currentIndex() + 1) % this.productosCombinadosConTipo.length)
    }
  }

  prevSlide() {
    if (this.productosCombinadosConTipo.length > 0) {
      this.currentIndex.set(
        (this.currentIndex() - 1 + this.productosCombinadosConTipo.length) % this.productosCombinadosConTipo.length,
      )
    }
  }

  // Producto actual
  productoActual = computed(() => {
    if (this.productosCombinadosConTipo.length === 0) {
      return null
    }
    return this.productosCombinadosConTipo[this.currentIndex()]
  })

  // Tipo del producto actual
  tipoProductoActual = computed(() => {
    const producto = this.productoActual()
    return producto ? producto.tipo : null
  })

  // Precio con descuento aplicado
  precio = computed(() => {
    const producto = this.productoActual()
    if (!producto) return 0

    let idMoneda = this.carritoService.moneda()?.idMoneda
    if (idMoneda == undefined) idMoneda = 1
    return this.productsService.getPrecio(true, producto)
  })

  // URL de la imagen
  imagen = computed(() => {
    const prod = this.productoActual()
    if (!prod) return "/descargar.jpg"

      const image = prod.image_name!
      return IMAGES_PRODUCTOS + image
  })

  // Precio anterior para productos rebajados
  precioAnterior = computed(() => {
    const producto = this.productoActual()
    if (!producto || this.tipoProductoActual() !== "rebajado") return null
    return this.productsService.getPrecioAnterior(producto)
  })

  // Verificar si el producto tiene descuento normal (no rebaja)
  tieneDescuentoNormal = computed(() => {
    const producto = this.productoActual()
    if (!producto) return false

    const idMoneda = this.carritoService.moneda()?.idMoneda || 1
    return this.productsService.productoTieneDescuento(producto, idMoneda)
  })

  // Porcentaje de descuento normal
  getDescuentoPorcentaje(): number {
    const producto = this.productoActual()
    if (!producto) return 0

    const valorDescuento = this.productsService.getValorDescuento(producto)
    return valorDescuento ? Math.round(valorDescuento * 100) : 0
  }

  // Porcentaje de rebaja
  getPorcentajeRebaja(): number {
    if (this.tipoProductoActual() !== "rebajado") return 0

    const precioActual = this.precio()
    const precioAnterior = this.precioAnterior()

    if (!precioAnterior || precioAnterior <= 0) return 0

    const porcentaje = ((precioAnterior - precioActual) / precioAnterior) * 100
    return Math.round(porcentaje)
  }

  // Verificar si el producto tiene una etiqueta específica
  tieneEtiqueta(idEtiqueta: number): boolean {
    const producto = this.productoActual()
    if (!producto) return false

    return this.productsService.tieneEtiqueta(producto, idEtiqueta)
  }

  // Agregar producto al carrito
  agregarAlCarrito(): void {
    const producto = this.productoActual()
    if (!producto) return

    this.carritoService.agregarACarrito(producto)
    Swal.fire({
      position: "top-end",
      width: 300,
      icon: "success",
      title: "El producto se ha agregado correctamente",
      showConfirmButton: false,
      timer: 1000,
    })
  }

  // Manejar errores de carga de imágenes
  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement
    imgElement.src = "/descargar.jpg" // Imagen por defecto
    imgElement.onerror = null
  }
}
