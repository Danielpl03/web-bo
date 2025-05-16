import { Injectable, type WritableSignal, computed, inject, signal } from "@angular/core"
import type { Carrito, ItemCarrito } from "../interfaces/carrito"
import type { Moneda, Producto } from "../interfaces/producto"
import { ProductosService } from "./productos.service"
import { MonedaService } from "./moneda.service"

@Injectable({
  providedIn: "root",
})
export class CarritoService {
  constructor() {
    if (typeof window !== "undefined") {
      const cart = localStorage.getItem("cart")
      if (cart) {
        this.carrito.set(JSON.parse(cart))
        if (this.carrito().moneda == undefined) this.clear()
        else {
          this.monedasService.moneda.set(this.carrito().moneda)
          this.items = this.carrito().items.length
        }
      }
    }
  }

  moneda = computed(() => {
    // Actualizar el carrito con la moneda actual
    const moneda = this.monedasService.moneda()
    this.carrito().moneda = moneda
    this.actualizarImporte(moneda!)
    return moneda
  })

  tieneDescuento = computed(() => {
    // Verificar si algún producto del carrito tiene descuento en la moneda actual
    const monedaId = this.moneda()?.idMoneda || 1
    return this.carrito().items.some((item) => this.productsService.productoTieneDescuento(item.producto, monedaId))
  })

  productsService = inject(ProductosService)
  monedasService = inject(MonedaService)

  carrito: WritableSignal<Carrito> = signal({
    id: 0,
    moneda: undefined,
    items: [],
  })

  items = 0

  // Método actualizado para recalcular importes considerando descuentos por moneda
  actualizarImporte(moneda: Moneda) {
    this.carrito().items.forEach((item) => {
      // Recalcular el importe con el precio actualizado, aplicando descuento si corresponde
      item.importe = Math.round(item.cantidad * this.productsService.getPrecio(true, item.producto) * 10) / 10
    })
    this.actualizarLS()
  }

  agregarACarrito(producto: Producto, cant?: number) {
    if (this.carrito().id == 0) {
      this.carrito.set({ id: 1, moneda: this.moneda(), items: [] })
    }
    let found = false

    const precio = this.productsService.getPrecio(true, producto)

    this.carrito().items.forEach((item) => {
      if (item.producto.idProducto == producto.idProducto) {
        if (cant) {
          item.cantidad = cant
          item.importe = Math.round(cant * precio * 10) / 10
        } else {
          item.cantidad += 1
          item.importe = Math.round(item.cantidad * precio * 10) / 10
        }
        found = true
      }
    })
    if (!found) {
      const item: ItemCarrito = {
        producto: producto,
        cantidad: cant ? cant : 1,
        importe: cant ? cant * precio : precio,
      }
      this.carrito().items.push(item)
    }
    this.actualizarLS()
  }

  eliminarDeCarrito(producto: Producto, cant?: number) {
    const precio = this.productsService.getPrecio(true, producto)

    this.carrito().items.forEach((item) => {
      if (item.producto.idProducto == producto.idProducto) {
        if (cant != undefined && cant >= 0) {
          item.cantidad = cant
          item.importe = Math.round(cant * precio * 10) / 10
        } else {
          item.cantidad -= 1
          item.importe = Math.round(item.cantidad * precio * 10) / 10
        }
        if (item.cantidad <= 0) {
          this.carrito().items.splice(this.carrito().items.indexOf(item), 1)
        }
        return
      }
    })
    this.actualizarLS()
  }

  getItems() {
    return this.carrito().items
  }

  // Método actualizado para calcular importes con y sin descuento
  getImporte(descuento: boolean) {
    const monedaId = this.moneda()?.idMoneda || 1

    if (descuento) {
      // Calcular importe con descuentos aplicados
      let importe = 0
      this.carrito().items.forEach((item) => {
        importe += item.importe
      })
      return Math.ceil(importe)
    } else {
      // Calcular importe sin descuentos
      let importe = 0
      this.carrito().items.forEach((item) => {
        importe += this.productsService.getPrecio(false, item.producto) * item.cantidad
      })
      return Math.ceil(importe)
    }
  }

  // Método para calcular el ahorro total por descuentos
  getAhorroTotal(): number {
    const importeSinDescuento = this.getImporte(false)
    const importeConDescuento = this.getImporte(true)
    return importeSinDescuento - importeConDescuento
  }

  clear() {
    this.carrito.set({ id: 0, moneda: this.moneda(), items: [] })
    this.actualizarLS()
  }

  isEmpty() {
    return this.carrito().items.length == 0
  }

  actualizarLS() {
    this.items = this.carrito().items.length
    if (this.isEmpty()) {
      localStorage.removeItem("cart")
    } else {
      localStorage.setItem("cart", JSON.stringify(this.carrito()))
    }
  }

  // Método para forzar la actualización de la UI
  forzarActualizacion() {
    // Crear una copia del carrito para forzar la detección de cambios
    const carritoActual = this.carrito()
    this.carrito.set({ ...carritoActual })
    this.actualizarLS()
  }
}
