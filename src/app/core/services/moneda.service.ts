import { Injectable, type WritableSignal, signal, inject } from "@angular/core"
import type { Descuento, DescuentoPago, MetodoPago, Moneda } from "../interfaces/producto"
import { SupabaseService } from "./supabase.service"
import { CarritoService } from "./carrito.service"

@Injectable({
  providedIn: "root",
})
export class MonedaService {
  moneda: WritableSignal<Moneda | undefined> = signal(undefined)
  monedas: Moneda[] = []
  descuentosPagos: DescuentoPago[] = []
  descuentos: Descuento[] = []
  metodosPago: MetodoPago[] = []

  // Mapa para almacenar los descuentos por moneda de forma persistente
  private descuentosPorMoneda: Map<number, number[]> = new Map()

  constructor(private supabaseService: SupabaseService) {
    // Intentar cargar la moneda guardada
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("selectedCurrency")
      if (savedCurrency) {
        try {
          this.moneda.set(JSON.parse(savedCurrency))
        } catch (e) {
          console.error("Error al cargar moneda guardada:", e)
        }
      }
    }

    // Cargar todas las monedas y descuentos
    this.inicializarDatos()
  }

  async inicializarDatos() {
    try {
      // Cargar monedas, descuentos, métodos de pago y relaciones en paralelo
      const [monedas, descuentos, metodosPago, descuentosPagos] = await Promise.all([
        this.getMonedas(),
        this.getDescuentos(),
        this.getMetodosPago(),
        this.getDescuentosPagos(),
      ])

      this.monedas = monedas
      this.descuentos = descuentos
      this.metodosPago = metodosPago
      this.descuentosPagos = descuentosPagos

      console.log("Monedas cargadas:", this.monedas)
      console.log("Métodos de pago cargados:", this.metodosPago)
      console.log("Descuentos cargados:", this.descuentos)
      console.log("Relaciones descuentos-pagos cargadas:", this.descuentosPagos)

      // Asignar descuentos a cada moneda basado en sus métodos de pago
      this.asignarDescuentosAMonedas()

      // Establecer moneda por defecto si no hay una seleccionada
      if (this.moneda() == undefined) {
        this.moneda.set(this.monedas[0])
      } else {
        // Actualizar la moneda actual con sus descuentos
        const monedaActual = this.monedas.find((m) => m.idMoneda === this.moneda()?.idMoneda)
        if (monedaActual) {
          this.moneda.set(monedaActual)
        }
      }

      console.log("Moneda actual con descuentos:", this.moneda())
    } catch (error) {
      console.error("Error al inicializar datos de monedas y descuentos:", error)
    }
  }

  private asignarDescuentosAMonedas() {
    // Limpiar el mapa de descuentos por moneda
    this.descuentosPorMoneda.clear()

    for (const moneda of this.monedas) {
      // Encontrar todos los métodos de pago para esta moneda
      // Eliminar el filtro de activo ya que no existe esa columna
      const metodosPagoMoneda = this.metodosPago.filter((mp) => mp.idMoneda === moneda.idMoneda)

      console.log(`Métodos de pago para moneda ${moneda.nombre}:`, metodosPagoMoneda)

      // Obtener IDs de los métodos de pago
      const idsPagoMoneda = metodosPagoMoneda.map((mp) => mp.idPago)

      // Encontrar todos los descuentos asociados a estos métodos de pago
      const descuentosIds = this.descuentosPagos
        .filter((dp) => idsPagoMoneda.includes(dp.idPago))
        .map((dp) => dp.idDescuento)

      console.log(`IDs de descuentos para moneda ${moneda.nombre}:`, descuentosIds)

      // Eliminar duplicados
      const descuentosUnicos = [...new Set(descuentosIds)]

      // Guardar en el mapa para acceso persistente
      this.descuentosPorMoneda.set(moneda.idMoneda, descuentosUnicos)

      // Asignar a la moneda
      moneda.descuentos = descuentosUnicos

      console.log(`Descuentos asignados a moneda ${moneda.nombre}:`, moneda.descuentos)
    }
  }

  tieneDescuento(idMoneda: number, idDescuento: number): boolean {
    // Usar el mapa para acceso persistente
    const descuentosMoneda = this.descuentosPorMoneda.get(idMoneda) || []
    const tieneDescuento = descuentosMoneda.includes(idDescuento)

    console.log(`Verificando si moneda ${idMoneda} tiene descuento ${idDescuento}:`, tieneDescuento)
    console.log(`Descuentos disponibles para moneda ${idMoneda}:`, descuentosMoneda)

    return tieneDescuento
  }

  getDescuentosDisponibles(idMoneda: number): number[] {
    // Usar el mapa para acceso persistente
    const descuentosMoneda = this.descuentosPorMoneda.get(idMoneda) || []
    console.log(`Obteniendo descuentos disponibles para moneda ${idMoneda}:`, descuentosMoneda)
    return descuentosMoneda
  }

  updateMoneda(moneda: Moneda) {
    if (moneda.idMoneda != this.moneda()?.idMoneda) {
      // Asegurarse de que la moneda tenga sus descuentos asignados
      const monedaCompleta = { ...moneda }

      // Asignar descuentos desde el mapa persistente
      monedaCompleta.descuentos = this.descuentosPorMoneda.get(moneda.idMoneda) || []

      this.moneda.set(monedaCompleta)

      // Guardar la preferencia de moneda en localStorage para persistencia
      if (typeof window !== "undefined") {
        localStorage.setItem("selectedCurrency", JSON.stringify(monedaCompleta))
      }

      // Notificar al carrito para actualizar precios
      this.notificarCambioMoneda()
    }
  }

  // Método para notificar cambios de moneda
  private notificarCambioMoneda() {
    // Este método será implementado por los servicios que necesiten
    // actualizar sus datos cuando cambie la moneda
    const carritoService = inject(CarritoService)
    if (carritoService) {
      carritoService.actualizarImporte(this.moneda()!)
    }
  }

  getTazaCambio(idMoneda = 2) {
    for (let i = 0; i < this.monedas.length; i++) {
      const moneda = this.monedas[i]
      if (moneda.idMoneda == idMoneda) {
        return moneda.tazaCambio
      }
    }
    return undefined
  }

  async getMoneda(idMoneda: number) {
    return this.getMonedas().then((monedas) => {
      return monedas.find((moneda) => moneda.idMoneda == idMoneda)
    })
  }

  async getMonedas(): Promise<Moneda[]> {
    if (this.monedas.length == 0) {
      try {
        // Obtener monedas de Supabase
        const monedasData = await this.supabaseService.fetch("monedas")

        // Transformar los datos para que coincidan con la interfaz esperada
        this.monedas = monedasData.map((m: any) => ({
          idMoneda: m.id_moneda,
          nombre: m.nombre,
          siglas: m.siglas,
          tazaCambio: m.taza_cambio,
          descuentos: [], // Se llenarán después
        }))
      } catch (error) {
        console.error("Error al obtener monedas:", error)
        return []
      }
    }
    return this.monedas
  }

  async getDescuentos(): Promise<Descuento[]> {
    if (this.descuentos.length === 0) {
      try {
        // Obtener descuentos de Supabase
        const descuentosData = await this.supabaseService.fetch("descuentos", {
          filters: [{ column: "activo", operator: "eq", value: true }],
        })

        // Transformar los datos
        this.descuentos = descuentosData.map((d: any) => ({
          idDescuento: d.id_descuento,
          color: d.color,
          valor: d.valor,
          nombre: d.nombre,
          activo: d.activo,
        }))
      } catch (error) {
        console.error("Error al obtener descuentos:", error)
        return []
      }
    }
    return this.descuentos
  }

  async getMetodosPago(): Promise<MetodoPago[]> {
    if (this.metodosPago.length === 0) {
      try {
        // Obtener métodos de pago de Supabase
        // Eliminar el filtro de activo ya que no existe esa columna
        const metodosPagoData = await this.supabaseService.fetch("pagos")

        console.log("Datos originales de métodos de pago:", metodosPagoData)

        // Transformar los datos según la estructura real de la tabla pagos
        this.metodosPago = metodosPagoData.map((mp: any) => ({
          idPago: mp.id_pago,
          tipoPago: mp.tipo_pago,
          idMoneda: mp.id_moneda,
          efectivo: mp.efectivo
          // Eliminar la propiedad activo
        }))
      } catch (error) {
        console.error("Error al obtener métodos de pago:", error)
        return []
      }
    }
    return this.metodosPago
  }

  async getDescuentosPagos(): Promise<DescuentoPago[]> {
    if (this.descuentosPagos.length === 0) {
      try {
        // Obtener relaciones de descuentos con métodos de pago
        const descuentosPagosData = await this.supabaseService.fetch("descuentos_pagos")

        console.log("Datos originales de descuentos_pagos:", descuentosPagosData)

        // Transformar los datos
        this.descuentosPagos = descuentosPagosData.map((dp: any) => ({
          idRelacion: dp.id_relacion,
          idDescuento: dp.id_descuento,
          idPago: dp.id_pago,
        }))
      } catch (error) {
        console.error("Error al obtener descuentos_pagos:", error)
        return []
      }
    }
    return this.descuentosPagos
  }
}
