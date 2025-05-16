import { Injectable, type WritableSignal, signal, inject } from "@angular/core"
import type { Descuento, DescuentoPago, Moneda } from "../interfaces/producto"
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
      // Cargar monedas, descuentos y relaciones en paralelo
      const [monedas, descuentos, descuentosPagos] = await Promise.all([
        this.getMonedas(),
        this.getDescuentos(),
        this.getDescuentosPagos(),
      ])

      this.monedas = monedas
      this.descuentos = descuentos
      this.descuentosPagos = descuentosPagos

      // Asignar descuentos a cada moneda
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
    } catch (error) {
      console.error("Error al inicializar datos de monedas y descuentos:", error)
    }
  }

  // Asignar descuentos a cada moneda basado en descuentos_pagos
  private asignarDescuentosAMonedas() {
    for (const moneda of this.monedas) {
      let idDesc: number[] = [];
      for(const dp of this.descuentosPagos){
        if(moneda.idMoneda == 1 && (dp.idPago == 1 || dp.idPago == 2)){
          idDesc = [...idDesc, dp.idDescuento];
        }else if (moneda.idMoneda == 2 && (dp.idPago == 3 || dp.idPago == 4) ) {
          idDesc = [...idDesc, dp.idDescuento];
        }
      }

      // Encontrar todos los descuentos asociados a esta moneda
      // const descuentosIds = this.descuentosPagos
      //   .filter((dp) => (dp.idPago == 1 || dp.idPago == 2 && 1 == moneda.idMoneda) || (dp.idPago == 3 || dp.idPago == 4 && 2 == moneda.idMoneda) )
      //   .map((dp) => dp.idDescuento)

      console.log(moneda, idDesc);

      // Eliminar duplicados
      moneda.descuentos = [...new Set(idDesc)]
    }
    console.log(this.monedas)
  }

  // Verificar si una moneda tiene un descuento específico
  tieneDescuento(idMoneda: number, idDescuento: number): boolean {
    console.log("tieneDescuento", idMoneda, idDescuento)
    const moneda = this.monedas.find((m) => m.idMoneda === idMoneda)
    return moneda?.descuentos?.includes(idDescuento) || false
  }

  // Obtener todos los descuentos disponibles para una moneda
  getDescuentosDisponibles(idMoneda: number): number[] {
    const moneda = this.monedas.find((m) => m.idMoneda === idMoneda)
    return moneda?.descuentos || []
  }

  updateMoneda(moneda: Moneda) {
    if (moneda.idMoneda != this.moneda()?.idMoneda) {
      // Asegurarse de que la moneda tenga sus descuentos asignados
      const monedaCompleta = this.monedas.find((m) => m.idMoneda === moneda.idMoneda) || moneda

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

  async getDescuentosPagos(): Promise<DescuentoPago[]> {
    if (this.descuentosPagos.length === 0) {
      try {
        // Obtener relaciones de descuentos con métodos de pago y monedas
        const descuentosPagosData = await this.supabaseService.fetch("descuentos_pagos")

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

// Importación circular - se resuelve con una declaración de tipo
