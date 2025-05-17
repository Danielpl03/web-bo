import { Injectable, computed, inject } from "@angular/core"
import type { Producto } from "../interfaces/producto"
import type { Busqueda } from "../interfaces/busqueda"
import { MonedaService } from "./moneda.service"
import { SupabaseService } from "./supabase.service"

@Injectable({
  providedIn: "root",
})
export class ProductosService {
  constructor(private supabaseService: SupabaseService) {}

  moneda = computed(() => {
    return this.monedaService.moneda()
  })

  localidades: number[] = [102, 103, 105]

  monedaService = inject(MonedaService)

  parseName(descripcion: string, codigo?: string): string {
    let finalDesc = codigo ? (descripcion + " -" + codigo) : descripcion; 
    const caracteres = '<>:\"/\\|?*\'';
    finalDesc = finalDesc.split('').map(c => caracteres.includes(c) ? '_' : c).join('');
    return finalDesc.replace(/ /g, '_');
  }

  // Método para obtener productos con etiqueta específica
  async getProductosPorEtiqueta(idEtiqueta: number): Promise<Producto[]> {
    try {
      // Obtener productos con la etiqueta especificada
      const etiquetasProductosData = await this.supabaseService.fetch("etiquetas_productos", {
        filters: [{ column: "id_etiqueta", operator: "eq", value: idEtiqueta }],
      })

      if (etiquetasProductosData.length === 0) {
        return []
      }

      const productosIds = etiquetasProductosData.map((ep: any) => ep.id_producto)

      const productosData = await this.supabaseService.fetch("productos", {
        filters: [
          { column: "id_producto", operator: "in", value: productosIds },
          { column: "activo", operator: "eq", value: true },
        ],
      })

      // Obtener información adicional para estos productos
      const [preciosData, descuentosProductosData, stocksData] = await Promise.all([
        this.supabaseService.fetch("precios", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("descuentos_productos", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("stocks", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
      ])

      // Obtener descuentos
      const descuentosIds = descuentosProductosData.map((d: any) => d.id_descuento)
      const descuentosData = await this.supabaseService.fetch("descuentos", {
        filters: [{ column: "id_descuento", operator: "in", value: descuentosIds }],
      })

      // Transformar productos con toda la información relacionada
      return productosData.map((p: any) => {
        // Obtener precios para este producto
        const precios = preciosData
          .filter((precio: any) => precio.id_producto === p.id_producto)
          .map((precio: any) => ({
            idPrecio: precio.id_precio,
            idProducto: precio.id_producto,
            idMoneda: precio.id_moneda,
            precio: precio.precio,
          }))

        // Obtener descuentos para este producto
        const descuentosProducto = descuentosProductosData
          .filter((dp: any) => dp.id_producto === p.id_producto)
          .map((dp: any) => {
            const descuento = descuentosData.find((d: any) => d.id_descuento === dp.id_descuento)
            if (descuento) {
              return {
                idDescuento: descuento.id_descuento,
                color: descuento.color,
                valor: descuento.valor,
                nombre: descuento.nombre,
                activo: descuento.activo,
              }
            }
            return null
          })
          .filter((d): d is { idDescuento: any; color: any; valor: any; nombre: any; activo: any } => d !== null)

        // Obtener etiquetas para este producto
        const etiquetasProducto = etiquetasProductosData
          .filter((ep: any) => ep.id_producto === p.id_producto)
          .map((ep: any) => ({
            idRelacion: ep.id_relacion,
            idEtiqueta: ep.id_etiqueta,
            idProducto: ep.id_producto,
            valor: ep.valor,
          }))

        // Obtener stocks para este producto
        const stocks = stocksData
          .filter((s: any) => s.id_producto === p.id_producto)
          .reduce((acc: number[], s: any) => {
            acc[s.id_localidad] = s.stock
            return acc
          }, [])

        // Construir objeto producto completo
        return {
          idProducto: p.id_producto,
          idDepartamento: p.id_departamento,
          codigo: p.codigo,
          descripcion: p.descripcion,
          image_name: this.parseName(p.descripcion, p.codigo), // Nombre de imagen predeterminado
          ipv: p.ipv,
          activo: p.activo,
          combo: p.combo,
          precio: precios[0], // Primer precio como precio principal
          precios: precios,
          idCategoria: p.id_categoria,
          descuentos: descuentosProducto.length > 0 ? descuentosProducto : undefined,
          etiquetasProductos: etiquetasProducto,
          stocks: stocks.length > 0 ? stocks : undefined,
        }
      })
    } catch (error) {
      console.error(`Error al obtener productos con etiqueta ${idEtiqueta}:`, error)
      return []
    }
  }

  // Método para obtener productos destacados (etiqueta id 3)
  async getProductosDestacados(): Promise<Producto[]> {
    return this.getProductosPorEtiqueta(3)
  }

  // Añadir método para obtener productos con rebaja
  async getProductosRebajados(): Promise<Producto[]> {
    try {
      // Obtener productos con etiqueta "Rebaja" (id 2)
      const etiquetasProductosData = await this.supabaseService.fetch("etiquetas_productos", {
        filters: [{ column: "id_etiqueta", operator: "eq", value: 2 }], // Etiqueta "Rebaja"
      })

      if (etiquetasProductosData.length === 0) {
        return []
      }

      const productosIds = etiquetasProductosData.map((ep: any) => ep.id_producto)

      const productosData = await this.supabaseService.fetch("productos", {
        filters: [
          { column: "id_producto", operator: "in", value: productosIds },
          { column: "activo", operator: "eq", value: true },
        ],
      })

      // Obtener información adicional para estos productos
      const [preciosData, descuentosProductosData, stocksData] = await Promise.all([
        this.supabaseService.fetch("precios", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("descuentos_productos", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("stocks", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
      ])

      // Obtener descuentos
      const descuentosIds = descuentosProductosData.map((d: any) => d.id_descuento)
      const descuentosData = await this.supabaseService.fetch("descuentos", {
        filters: [{ column: "id_descuento", operator: "in", value: descuentosIds }],
      })

      // Transformar productos con toda la información relacionada
      return productosData.map((p: any) => {
        // Obtener precios para este producto
        const precios = preciosData
          .filter((precio: any) => precio.id_producto === p.id_producto)
          .map((precio: any) => ({
            idPrecio: precio.id_precio,
            idProducto: precio.id_producto,
            idMoneda: precio.id_moneda,
            precio: precio.precio,
          }))

        // Obtener descuentos para este producto
        const descuentosProducto = descuentosProductosData
          .filter((dp: any) => dp.id_producto === p.id_producto)
          .map((dp: any) => {
            const descuento = descuentosData.find((d: any) => d.id_descuento === dp.id_descuento)
            if (descuento) {
              return {
                idDescuento: descuento.id_descuento,
                color: descuento.color,
                valor: descuento.valor,
                nombre: descuento.nombre,
                activo: descuento.activo,
              }
            }
            return null
          })
          .filter((d): d is { idDescuento: any; color: any; valor: any; nombre: any; activo: any } => d !== null)

        // Obtener etiquetas para este producto (ya sabemos que tiene la etiqueta "Rebaja")
        const etiquetasProducto = etiquetasProductosData
          .filter((ep: any) => ep.id_producto === p.id_producto)
          .map((ep: any) => ({
            idRelacion: ep.id_relacion,
            idEtiqueta: ep.id_etiqueta,
            idProducto: ep.id_producto,
            valor: ep.valor,
          }))

        // Obtener stocks para este producto
        const stocks = stocksData
          .filter((s: any) => s.id_producto === p.id_producto)
          .reduce((acc: number[], s: any) => {
            acc[s.id_localidad] = s.stock
            return acc
          }, [])

        // Construir objeto producto completo
        return {
          idProducto: p.id_producto,
          idDepartamento: p.id_departamento,
          codigo: p.codigo,
          descripcion: p.descripcion,
          image_name: this.parseName(p.descripcion, p.codigo), // Nombre de imagen predeterminado
          ipv: p.ipv,
          activo: p.activo,
          combo: p.combo,
          precio: precios[0], // Primer precio como precio principal
          precios: precios,
          idCategoria: p.id_categoria,
          descuentos: descuentosProducto.length > 0 ? descuentosProducto : undefined,
          etiquetasProductos: etiquetasProducto,
          stocks: stocks.length > 0 ? stocks : undefined,
        }
      })
    } catch (error) {
      console.error("Error al obtener productos rebajados:", error)
      return []
    }
  }

  // Método para obtener el precio anterior de un producto con rebaja
  getPrecioAnterior(producto: Producto): number | null {
    if (!producto.etiquetasProductos) return null

    // Buscar la etiqueta de rebaja (id 2)
    const etiquetaRebaja = producto.etiquetasProductos.find((et) => et.idEtiqueta === 2)
    if (!etiquetaRebaja) return null

    // El valor de la etiqueta contiene el precio anterior
    const precioAnterior = Number.parseFloat(etiquetaRebaja.valor)
    if (isNaN(precioAnterior)) return null

    // Convertir el precio anterior a la moneda actual si es necesario
    const currentMonedaId = this.moneda()?.idMoneda || 1

    // Si el precio está en la misma moneda, devolverlo directamente
    if (producto.precio && producto.precio.idMoneda === currentMonedaId) {
      return precioAnterior
    }

    // Si necesitamos convertir el precio
    if (producto.precio) {
      if (producto.precio.idMoneda === 1 && currentMonedaId === 2) {
        // Convertir de CUP a USD
        const taza = this.monedaService.getTazaCambio(2) || 370
        return Math.round((precioAnterior / taza) * 10) / 10
      } else if (producto.precio.idMoneda === 2 && currentMonedaId === 1) {
        // Convertir de USD a CUP
        const taza = this.monedaService.getTazaCambio(2) || 370
        return Math.round(precioAnterior * taza * 10) / 10
      }
    }

    return precioAnterior
  }

  // Método para verificar si un producto tiene la etiqueta específica
  tieneEtiqueta(producto: Producto, idEtiqueta: number): boolean {
    if (!producto.etiquetasProductos) return false
    return producto.etiquetasProductos.some((et) => et.idEtiqueta === idEtiqueta)
  }

  async getAll(): Promise<Producto[]> {
    try {
      // Obtener productos de Supabase
      const productosData = await this.supabaseService.fetch("productos", {
        filters: [{ column: "activo", operator: "eq", value: true }],
      })

      // Obtener stocks para filtrado
      const stocksData = await this.supabaseService.fetch("stocks")

      // Obtener precios para estos productos
      const productosIds = productosData.map((p: any) => p.id_producto)

      const [preciosData, descuentosProductosData, etiquetasProductosData] = await Promise.all([
        this.supabaseService.fetch("precios", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("descuentos_productos", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("etiquetas_productos", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
      ])

      // Obtener descuentos
      const descuentosIds = descuentosProductosData.map((d: any) => d.id_descuento)
      const descuentosData = await this.supabaseService.fetch("descuentos", {
        filters: [{ column: "id_descuento", operator: "in", value: descuentosIds }],
      })

      // Filtrar productos basados en stocks
      const productosFiltrados = productosData.filter((producto: any) => {
        // Verificar si el producto tiene stock en alguna de las localidades
        const stocksProducto = stocksData.filter(
          (stock: any) =>
            stock.id_producto === producto.id_producto &&
            this.localidades.includes(stock.id_localidad) &&
            stock.stock > 0,
        )

        return stocksProducto.length > 0
      })

      // Transformar productos con toda la información relacionada
      return productosFiltrados.map((p: any) => {
        // Obtener precios para este producto
        const precios = preciosData
          .filter((precio: any) => precio.id_producto === p.id_producto)
          .map((precio: any) => ({
            idPrecio: precio.id_precio,
            idProducto: precio.id_producto,
            idMoneda: precio.id_moneda,
            precio: precio.precio,
          }))

        // Obtener descuentos para este producto
        const descuentosProducto = descuentosProductosData
          .filter((dp: any) => dp.id_producto === p.id_producto)
          .map((dp: any) => {
            const descuento = descuentosData.find((d: any) => d.id_descuento === dp.id_descuento)
            if (descuento) {
              return {
                idDescuento: descuento.id_descuento,
                color: descuento.color,
                valor: descuento.valor,
                nombre: descuento.nombre,
                activo: descuento.activo,
              }
            }
            return null
          })
          .filter((d): d is { idDescuento: any; color: any; valor: any; nombre: any; activo: any } => d !== null)

        // Obtener etiquetas para este producto
        const etiquetasProducto = etiquetasProductosData
          .filter((ep: any) => ep.id_producto === p.id_producto)
          .map((ep: any) => ({
            idRelacion: ep.id_relacion,
            idEtiqueta: ep.id_etiqueta,
            idProducto: ep.id_producto,
            valor: ep.valor,
          }))

        // Obtener stocks para este producto
        const stocks = stocksData
          .filter((s: any) => s.id_producto === p.id_producto)
          .reduce((acc: number[], s: any) => {
            acc[s.id_localidad] = s.stock
            return acc
          }, [])

        // Construir objeto producto completo
        return {
          idProducto: p.id_producto,
          idDepartamento: p.id_departamento,
          codigo: p.codigo,
          descripcion: p.descripcion,
          image_name: this.parseName(p.descripcion, p.codigo), // Nombre de imagen predeterminado
          ipv: p.ipv,
          activo: p.activo,
          combo: p.combo,
          precio: precios[0], // Primer precio como precio principal
          precios: precios,
          idCategoria: p.id_categoria,
          descuentos: descuentosProducto.length > 0 ? descuentosProducto : undefined,
          etiquetasProductos: etiquetasProducto.length > 0 ? etiquetasProducto : undefined,
          stocks: stocks.length > 0 ? stocks : undefined,
        }
      })
    } catch (error) {
      console.error("Error al obtener productos:", error)
      return []
    }
  }

  async getByDepartamento(idDepartamento: number): Promise<Producto[] | undefined> {
    try {
      // Obtener productos por departamento de Supabase
      const productosData = await this.supabaseService.fetch("productos", {
        filters: [
          { column: "id_departamento", operator: "eq", value: idDepartamento },
          { column: "activo", operator: "eq", value: true },
        ],
      })

      if (!productosData || productosData.length === 0) {
        return undefined
      }

      // Obtener stocks para estos productos
      const productosIds = productosData.map((p: any) => p.id_producto)
      const stocksData = await this.supabaseService.fetch("stocks", {
        filters: [{ column: "id_producto", operator: "in", value: productosIds }],
      })

      // Obtener precios, descuentos y etiquetas
      const [preciosData, descuentosProductosData, etiquetasProductosData] = await Promise.all([
        this.supabaseService.fetch("precios", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("descuentos_productos", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("etiquetas_productos", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
      ])

      // Obtener descuentos
      const descuentosIds = descuentosProductosData.map((d: any) => d.id_descuento)
      const descuentosData = await this.supabaseService.fetch("descuentos", {
        filters: [{ column: "id_descuento", operator: "in", value: descuentosIds }],
      })

      // Crear un mapa de producto ID a sus stocks
      const stockMap = new Map()
      stocksData.forEach((stock: any) => {
        if (!stockMap.has(stock.id_producto)) {
          stockMap.set(stock.id_producto, {})
        }
        stockMap.get(stock.id_producto)[stock.id_localidad] = stock.stock
      })

      // Filtrar productos con stock en alguna de las localidades
      const productosFiltrados = productosData.filter((producto: any) => {
        const stocksProducto = stockMap.get(producto.id_producto)
        if (!stocksProducto) return false

        for (const localidad of this.localidades) {
          if (stocksProducto[localidad] && stocksProducto[localidad] > 0) {
            return true
          }
        }
        return false
      })

      // Transformar productos con toda la información relacionada
      return productosFiltrados.map((p: any) => {
        // Obtener precios para este producto
        const precios = preciosData
          .filter((precio: any) => precio.id_producto === p.id_producto)
          .map((precio: any) => ({
            idPrecio: precio.id_precio,
            idProducto: precio.id_producto,
            idMoneda: precio.id_moneda,
            precio: precio.precio,
          }))

        // Obtener descuentos para este producto
        const descuentosProducto = descuentosProductosData
          .filter((dp: any) => dp.id_producto === p.id_producto)
          .map((dp: any) => {
            const descuento = descuentosData.find((d: any) => d.id_descuento === dp.id_descuento)
            if (descuento) {
              return {
                idDescuento: descuento.id_descuento,
                color: descuento.color,
                valor: descuento.valor,
                nombre: descuento.nombre,
                activo: descuento.activo,
              }
            }
            return null
          })
          .filter((d): d is { idDescuento: any; color: any; valor: any; nombre: any; activo: any } => d !== null)

        // Obtener etiquetas para este producto
        const etiquetasProducto = etiquetasProductosData
          .filter((ep: any) => ep.id_producto === p.id_producto)
          .map((ep: any) => ({
            idRelacion: ep.id_relacion,
            idEtiqueta: ep.id_etiqueta,
            idProducto: ep.id_producto,
            valor: ep.valor,
          }))

        // Obtener stocks para este producto
        const stocks = stocksData
          .filter((s: any) => s.id_producto === p.id_producto)
          .reduce((acc: number[], s: any) => {
            acc[s.id_localidad] = s.stock
            return acc
          }, [])

        // Construir objeto producto completo
        return {
          idProducto: p.id_producto,
          idDepartamento: p.id_departamento,
          codigo: p.codigo,
          descripcion: p.descripcion,
          image_name: this.parseName(p.descripcion, p.codigo), // Nombre de imagen predeterminado
          ipv: p.ipv,
          activo: p.activo,
          combo: p.combo,
          precio: precios[0], // Primer precio como precio principal
          precios: precios,
          idCategoria: p.id_categoria,
          descuentos: descuentosProducto.length > 0 ? descuentosProducto : undefined,
          etiquetasProductos: etiquetasProducto.length > 0 ? etiquetasProducto : undefined,
          stocks: stocks.length > 0 ? stocks : undefined,
        }
      })
    } catch (error) {
      console.error(`Error al obtener productos por departamento ${idDepartamento}:`, error)
      return undefined
    }
  }

  async getByCategoria(idCategoria: number): Promise<Producto[] | undefined> {
    try {
      // Obtener productos por categoría de Supabase
      const productosData = await this.supabaseService.fetch("productos", {
        filters: [
          { column: "id_categoria", operator: "eq", value: idCategoria },
          { column: "activo", operator: "eq", value: true },
        ],
      })

      if (!productosData || productosData.length === 0) {
        return undefined
      }

      // Obtener stocks para estos productos
      const productosIds = productosData.map((p: any) => p.id_producto)
      const stocksData = await this.supabaseService.fetch("stocks", {
        filters: [{ column: "id_producto", operator: "in", value: productosIds }],
      })

      // Obtener precios, descuentos y etiquetas
      const [preciosData, descuentosProductosData, etiquetasProductosData] = await Promise.all([
        this.supabaseService.fetch("precios", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("descuentos_productos", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("etiquetas_productos", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
      ])

      // Obtener descuentos
      const descuentosIds = descuentosProductosData.map((d: any) => d.id_descuento)
      const descuentosData = await this.supabaseService.fetch("descuentos", {
        filters: [{ column: "id_descuento", operator: "in", value: descuentosIds }],
      })

      // Crear un mapa de producto ID a sus stocks
      const stockMap = new Map()
      stocksData.forEach((stock: any) => {
        if (!stockMap.has(stock.id_producto)) {
          stockMap.set(stock.id_producto, {})
        }
        stockMap.get(stock.id_producto)[stock.id_localidad] = stock.stock
      })

      // Filtrar productos con stock en alguna de las localidades
      const productosFiltrados = productosData.filter((producto: any) => {
        const stocksProducto = stockMap.get(producto.id_producto)
        if (!stocksProducto) return false

        for (const localidad of this.localidades) {
          if (stocksProducto[localidad] && stocksProducto[localidad] > 0) {
            return true
          }
        }
        return false
      })

      // Transformar productos con toda la información relacionada
      return productosFiltrados.map((p: any) => {
        // Obtener precios para este producto
        const precios = preciosData
          .filter((precio: any) => precio.id_producto === p.id_producto)
          .map((precio: any) => ({
            idPrecio: precio.id_precio,
            idProducto: precio.id_producto,
            idMoneda: precio.id_moneda,
            precio: precio.precio,
          }))

        // Obtener descuentos para este producto
        const descuentosProducto = descuentosProductosData
          .filter((dp: any) => dp.id_producto === p.id_producto)
          .map((dp: any) => {
            const descuento = descuentosData.find((d: any) => d.id_descuento === dp.id_descuento)
            if (descuento) {
              return {
                idDescuento: descuento.id_descuento,
                color: descuento.color,
                valor: descuento.valor,
                nombre: descuento.nombre,
                activo: descuento.activo,
              }
            }
            return null
          })
          .filter((d): d is { idDescuento: any; color: any; valor: any; nombre: any; activo: any } => d !== null)

        // Obtener etiquetas para este producto
        const etiquetasProducto = etiquetasProductosData
          .filter((ep: any) => ep.id_producto === p.id_producto)
          .map((ep: any) => ({
            idRelacion: ep.id_relacion,
            idEtiqueta: ep.id_etiqueta,
            idProducto: ep.id_producto,
            valor: ep.valor,
          }))

        // Obtener stocks para este producto
        const stocks = stocksData
          .filter((s: any) => s.id_producto === p.id_producto)
          .reduce((acc: number[], s: any) => {
            acc[s.id_localidad] = s.stock
            return acc
          }, [])

        // Construir objeto producto completo
        return {
          idProducto: p.id_producto,
          idDepartamento: p.id_departamento,
          codigo: p.codigo,
          descripcion: p.descripcion,
          image_name: this.parseName(p.descripcion, p.codigo), // Nombre de imagen predeterminado
          ipv: p.ipv,
          activo: p.activo,
          combo: p.combo,
          precio: precios[0], // Primer precio como precio principal
          precios: precios,
          idCategoria: p.id_categoria,
          descuentos: descuentosProducto.length > 0 ? descuentosProducto : undefined,
          etiquetasProductos: etiquetasProducto.length > 0 ? etiquetasProducto : undefined,
          stocks: stocks.length > 0 ? stocks : undefined,
        }
      })
    } catch (error) {
      console.error(`Error al obtener productos por categoría ${idCategoria}:`, error)
      return undefined
    }
  }

  // Mejorar el método getByBusqueda para que sea más efectivo
  async getByBusqueda(busqueda: Busqueda): Promise<Producto[]> {
    try {
      const texto = busqueda.texto.toLowerCase().trim()

      if (texto.length < 2) {
        return []
      }

      // Obtener productos que coincidan con el texto de búsqueda
      const productosData = await this.supabaseService.fetchAll("productos", {
        filters: [{ column: "activo", operator: "eq", value: true }],
      })

      // Filtrar productos basados en el texto de búsqueda
      const productosFiltrados = productosData.filter((producto: any) => {
        // Buscar en código
        if (producto.codigo && producto.codigo.toLowerCase().includes(texto)) return true

        // Buscar en descripción
        if (producto.descripcion.toLowerCase().includes(texto)) return true

        return false
      })

      // Si no hay resultados, devolver array vacío
      if (productosFiltrados.length === 0) {
        return []
      }

      // Obtener información adicional para estos productos
      const productosIds = productosFiltrados.map((p: any) => p.id_producto)

      const [preciosData, descuentosProductosData, etiquetasProductosData, stocksData] = await Promise.all([
        this.supabaseService.fetch("precios", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("descuentos_productos", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("etiquetas_productos", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
        this.supabaseService.fetch("stocks", {
          filters: [{ column: "id_producto", operator: "in", value: productosIds }],
        }),
      ])

      // Obtener descuentos
      const descuentosIds = descuentosProductosData.map((d: any) => d.id_descuento)
      const descuentosData = await this.supabaseService.fetch("descuentos", {
        filters: [{ column: "id_descuento", operator: "in", value: descuentosIds }],
      })

      // Filtrar productos con stock en alguna de las localidades
      const productosConStock = productosFiltrados.filter((producto: any) => {
        const stocksProducto = stocksData.filter(
          (stock: any) =>
            stock.id_producto === producto.id_producto &&
            this.localidades.includes(stock.id_localidad) &&
            stock.stock > 0,
        )

        return stocksProducto.length > 0
      })

      // Transformar productos con toda la información relacionada
      return productosConStock.map((p: any) => {
        // Obtener precios para este producto
        const precios = preciosData
          .filter((precio: any) => precio.id_producto === p.id_producto)
          .map((precio: any) => ({
            idPrecio: precio.id_precio,
            idProducto: precio.id_producto,
            idMoneda: precio.id_moneda,
            precio: precio.precio,
          }))

        // Obtener descuentos para este producto
        const descuentosProducto = descuentosProductosData
          .filter((dp: any) => dp.id_producto === p.id_producto)
          .map((dp: any) => {
            const descuento = descuentosData.find((d: any) => d.id_descuento === dp.id_descuento)
            if (descuento) {
              return {
                idDescuento: descuento.id_descuento,
                color: descuento.color,
                valor: descuento.valor,
                nombre: descuento.nombre,
                activo: descuento.activo,
              }
            }
            return null
          })
          .filter((d): d is { idDescuento: any; color: any; valor: any; nombre: any; activo: any } => d !== null)

        // Obtener etiquetas para este producto
        const etiquetasProducto = etiquetasProductosData
          .filter((ep: any) => ep.id_producto === p.id_producto)
          .map((ep: any) => ({
            idRelacion: ep.id_relacion,
            idEtiqueta: ep.id_etiqueta,
            idProducto: ep.id_producto,
            valor: ep.valor,
          }))

        // Obtener stocks para este producto
        const stocks = stocksData
          .filter((s: any) => s.id_producto === p.id_producto)
          .reduce((acc: number[], s: any) => {
            acc[s.id_localidad] = s.stock
            return acc
          }, [])

        // Construir objeto producto completo
        return {
          idProducto: p.id_producto,
          idDepartamento: p.id_departamento,
          codigo: p.codigo,
          descripcion: p.descripcion,
          image_name: this.parseName(p.descripcion, p.codigo), // Nombre de imagen predeterminado
          ipv: p.ipv,
          activo: p.activo,
          combo: p.combo,
          precio: precios.length > 0 ? precios[0] : undefined, // Primer precio como precio principal
          precios: precios,
          idCategoria: p.id_categoria,
          descuentos: descuentosProducto.length > 0 ? descuentosProducto : undefined,
          etiquetasProductos: etiquetasProducto.length > 0 ? etiquetasProducto : undefined,
          stocks: stocks.length > 0 ? stocks : undefined,
        }
      })
    } catch (error) {
      console.error(`Error al buscar productos con consulta "${busqueda.texto}":`, error)
      return []
    }
  }

  // Método para verificar si un producto tiene descuento en la moneda actual
  productoTieneDescuento(producto: Producto, idMoneda: number): boolean {
    if (!producto.descuentos || producto.descuentos.length === 0) {
      return false
    }

    // Obtener descuentos disponibles para la moneda
    const descuentosDisponibles = this.monedaService.getDescuentosDisponibles(idMoneda)
    console.log(`Descuentos disponibles para moneda ${idMoneda}:`, descuentosDisponibles)
    console.log(
      `Descuentos del producto ${producto.idProducto}:`,
      producto.descuentos.map((d) => d.idDescuento),
    )

    if (descuentosDisponibles.length === 0) {
      return false
    }

    // Verificar si alguno de los descuentos del producto está disponible para la moneda
    for (const descuento of producto.descuentos) {
      if (descuentosDisponibles.includes(descuento.idDescuento)) {
        console.log(
          `Producto ${producto.idProducto} tiene descuento ${descuento.idDescuento} disponible para moneda ${idMoneda}`,
        )
        return true
      }
    }

    return false
  }

  // Método para obtener el descuento aplicable a un producto en una moneda específica
  getDescuentoAplicable(producto: Producto, idMoneda: number) {
    if (!producto.descuentos || producto.descuentos.length === 0) {
      return null
    }

    // Obtener descuentos disponibles para la moneda
    const descuentosDisponibles = this.monedaService.getDescuentosDisponibles(idMoneda)
    console.log(`Buscando descuento aplicable para producto ${producto.idProducto} en moneda ${idMoneda}`)
    console.log(`Descuentos disponibles:`, descuentosDisponibles)
    console.log(
      `Descuentos del producto:`,
      producto.descuentos.map((d) => d.idDescuento),
    )

    if (descuentosDisponibles.length === 0) {
      return null
    }

    // Buscar el primer descuento del producto que esté disponible para la moneda
    for (const descuento of producto.descuentos) {
      if (descuentosDisponibles.includes(descuento.idDescuento)) {
        console.log(`Descuento aplicable encontrado:`, descuento)
        return descuento
      }
    }

    return null
  }

  // Mejorar el método para obtener el precio con descuento
  getPrecio(aplicarDescuento: boolean, producto: Producto): number {
    // Obtener el precio base en la moneda actual
    const currentMonedaId = this.moneda()?.idMoneda || 1
    let precioBase = 0

    // Encontrar el precio en la moneda actual
    if (producto.precios && producto.precios.length > 0) {
      // Intentar encontrar el precio para la moneda actual
      const precioMoneda = producto.precios.find((p) => p.idMoneda === currentMonedaId)

      if (precioMoneda) {
        precioBase = precioMoneda.precio
      } else if (producto.precios.length > 0) {
        // Si no hay precio en la moneda actual, usar el primer precio y convertirlo
        const primerPrecio = producto.precios[0]

        if (primerPrecio.idMoneda === 1 && currentMonedaId === 2) {
          // Convertir de CUP a USD
          const taza = this.monedaService.getTazaCambio(2) || 370
          precioBase = primerPrecio.precio / taza
        } else if (primerPrecio.idMoneda === 2 && currentMonedaId === 1) {
          // Convertir de USD a CUP
          const taza = this.monedaService.getTazaCambio(2) || 370
          precioBase = primerPrecio.precio * taza
        } else {
          // Usar el precio sin conversión si no podemos determinar la conversión
          precioBase = primerPrecio.precio
        }
      }
    }

    // Aplicar descuento si corresponde
    let precioFinal = precioBase
    if (aplicarDescuento) {
      const descuento = this.getDescuentoAplicable(producto, currentMonedaId)
      if (descuento) {
        precioFinal = precioBase * (1 - descuento.valor)
        console.log(`Aplicando descuento ${descuento.valor * 100}% al producto ${producto.idProducto}:`)
        console.log(`Precio base: ${precioBase}, Precio con descuento: ${precioFinal}`)
      }
    }

    // Redondear a 1 decimal
    return Math.round(precioFinal * 10) / 10
  }

  // Método para obtener el valor del descuento aplicable
  getValorDescuento(producto: Producto): number | null {
    const currentMonedaId = this.moneda()?.idMoneda || 1
    const descuento = this.getDescuentoAplicable(producto, currentMonedaId)
    return descuento ? descuento.valor : null
  }
}
