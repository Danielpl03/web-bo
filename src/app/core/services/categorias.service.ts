import { Injectable } from "@angular/core"
import type { Categoria } from "../interfaces/categoria"
import { SupabaseService } from "./supabase.service"

@Injectable({
  providedIn: "root",
})
export class CategoriasService {
  private cachedCategorias: Categoria[] | null = null
  private cachedCategoriaById: Map<number, Categoria> = new Map()
  private cachedCategoriasByDepartamento: Map<number, Categoria[]> = new Map()

  constructor(private supabaseService: SupabaseService) {}

  parseName(descripcion: string, codigo?: string): string {
    let finalDesc = codigo ? (descripcion + " -" + codigo) : descripcion; 
    const caracteres = '<>:\"/\\|?*\'';
    finalDesc = finalDesc.split('').map(c => caracteres.includes(c) ? '_' : c).join('');
    return finalDesc.replace(/ /g, '_');
  }

  async getAll(): Promise<Categoria[]> {
    // Devolver datos en caché si están disponibles
    if (this.cachedCategorias) {
      return this.cachedCategorias
    }

    try {
      // Crear una promesa que rechaza después de 5 segundos
      const timeoutPromise = new Promise<Categoria[]>((_, reject) => {
        setTimeout(() => reject(new Error("Tiempo de espera agotado al obtener categorías")), 5000)
      })

      // Obtener categorías de Supabase
      const fetchPromise = this.supabaseService.fetch("categorias")

      // Carrera entre la obtención y el tiempo de espera
      const categoriasData = (await Promise.race([fetchPromise, timeoutPromise])) as any[]

      // Transformar los datos para que coincidan con la interfaz esperada
      const categorias: Categoria[] = categoriasData.map((c) => ({
        idCategoria: c.id_categoria,
        nombre: c.nombre,
        idDepartamento: c.id_departamento,
        image_name: `categoria_${c.id_categoria}.jpg`, // Nombre de imagen predeterminado
      }))

      // Almacenar en caché el resultado
      this.cachedCategorias = categorias
      return categorias
    } catch (error) {
      console.error("Error al obtener categorías:", error)
      return []
    }
  }

  async getById(idCategoria: number): Promise<Categoria | undefined> {
    // Devolver datos en caché si están disponibles
    if (this.cachedCategoriaById.has(idCategoria)) {
      return this.cachedCategoriaById.get(idCategoria)
    }

    try {
      // Crear una promesa que rechaza después de 5 segundos
      const timeoutPromise = new Promise<Categoria | null>((_, reject) => {
        setTimeout(() => reject(new Error(`Tiempo de espera agotado al obtener categoría ${idCategoria}`)), 5000)
      })

      // Obtener categoría por ID de Supabase
      const fetchPromise = this.supabaseService.fetchById("categorias", idCategoria, "id_categoria")

      // Carrera entre la obtención y el tiempo de espera
      const categoriaData = (await Promise.race([fetchPromise, timeoutPromise])) as any

      if (!categoriaData) {
        return undefined
      }

      // Transformar los datos para que coincidan con la interfaz esperada
      const categoria: Categoria = {
        idCategoria: categoriaData.id_categoria,
        nombre: categoriaData.nombre,
        idDepartamento: categoriaData.id_departamento,
        image_name: `categoria_${categoriaData.id_categoria}.jpg`, // Nombre de imagen predeterminado
      }

      // Obtener productos para esta categoría con tiempo de espera
      const productosTimeoutPromise = new Promise<any[]>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Tiempo de espera agotado al obtener productos para categoría ${idCategoria}`)),
          5000,
        )
      })

      const productosFetchPromise = this.supabaseService.fetch("productos", {
        filters: [
          { column: "id_categoria", operator: "eq", value: idCategoria },
          { column: "activo", operator: "eq", value: true },
        ],
      })

      const productosData = await Promise.race([productosFetchPromise, productosTimeoutPromise])

      // Obtener precios para estos productos
      const productosIds = productosData.map((p: any) => p.id_producto)
      const preciosData = await this.supabaseService.fetch("precios", {
        filters: [{ column: "id_producto", operator: "in", value: productosIds }],
      })

      // Obtener descuentos para estos productos
      const descuentosProductosData = await this.supabaseService.fetch("descuentos_productos", {
        filters: [{ column: "id_producto", operator: "in", value: productosIds }],
      })

      const descuentosIds = descuentosProductosData.map((d: any) => d.id_descuento)
      const descuentosData = await this.supabaseService.fetch("descuentos", {
        filters: [{ column: "id_descuento", operator: "in", value: descuentosIds }],
      })

      // Obtener etiquetas para estos productos
      const etiquetasProductosData = await this.supabaseService.fetch("etiquetas_productos", {
        filters: [{ column: "id_producto", operator: "in", value: productosIds }],
      })

      const etiquetasIds = etiquetasProductosData.map((e: any) => e.id_etiqueta)
      const etiquetasData = await this.supabaseService.fetch("etiquetas", {
        filters: [{ column: "id_etiqueta", operator: "in", value: etiquetasIds }],
      })

      // Obtener stocks para estos productos
      const stocksData = await this.supabaseService.fetch("stocks", {
        filters: [{ column: "id_producto", operator: "in", value: productosIds }],
      })

      // Transformar productos con toda la información relacionada
      const productos = productosData.map((p: any) => {
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

      // Añadir productos a la categoría
      const categoriaWithProductos = {
        ...categoria,
        productos: productos,
      }

      // Almacenar en caché el resultado
      this.cachedCategoriaById.set(idCategoria, categoriaWithProductos)
      return categoriaWithProductos
    } catch (error) {
      console.error(`Error al obtener categoría ${idCategoria}:`, error)
      return undefined
    }
  }

  async getByDepartamento(idDepartamento: number): Promise<Categoria[] | undefined> {
    // Devolver datos en caché si están disponibles
    if (this.cachedCategoriasByDepartamento.has(idDepartamento)) {
      return this.cachedCategoriasByDepartamento.get(idDepartamento)
    }

    try {
      // Crear una promesa que rechaza después de 5 segundos
      const timeoutPromise = new Promise<Categoria[]>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Tiempo de espera agotado al obtener categorías para departamento ${idDepartamento}`)),
          5000,
        )
      })

      // Obtener categorías por departamento de Supabase
      const fetchPromise = this.supabaseService.fetch("categorias", {
        filters: [{ column: "id_departamento", operator: "eq", value: idDepartamento }],
      })

      // Carrera entre la obtención y el tiempo de espera
      const categoriasData = (await Promise.race([fetchPromise, timeoutPromise])) as any[]

      if (!categoriasData || categoriasData.length === 0) {
        return undefined
      }

      // Transformar los datos para que coincidan con la interfaz esperada
      const categorias: Categoria[] = categoriasData.map((c) => ({
        idCategoria: c.id_categoria,
        nombre: c.nombre,
        idDepartamento: c.id_departamento,
        image_name: `categoria_${c.id_categoria}.jpg`, // Nombre de imagen predeterminado
      }))

      // Para cada categoría, obtener sus productos
      const categoriasIds = categorias.map((cat) => cat.idCategoria)

      try {
        // Obtener todos los productos para estas categorías
        const productosTimeoutPromise = new Promise<any[]>((_, reject) => {
          setTimeout(() => reject(new Error(`Tiempo de espera agotado al obtener productos para categorías`)), 5000)
        })

        const productosFetchPromise = this.supabaseService.fetch("productos", {
          filters: [
            { column: "id_categoria", operator: "in", value: categoriasIds },
            { column: "activo", operator: "eq", value: true },
          ],
        })

        const productosData = await Promise.race([productosFetchPromise, productosTimeoutPromise])

        // Obtener precios, descuentos, etiquetas y stocks para estos productos
        const productosIds = productosData.map((p: any) => p.id_producto)

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

        // Transformar productos con toda la información relacionada
        const productosProcesados = productosData.map((p: any) => {
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

        // Agrupar productos por categoría
        const productosByCategoria = new Map<number, any[]>()
        productosProcesados.forEach((producto: any) => {
          if (!productosByCategoria.has(producto.idCategoria)) {
            productosByCategoria.set(producto.idCategoria, [])
          }
          productosByCategoria.get(producto.idCategoria)?.push(producto)
        })

        // Añadir productos a cada categoría
        const categoriasWithProductos = categorias.map((categoria) => ({
          ...categoria,
          productos: productosByCategoria.get(categoria.idCategoria) || [],
        }))

        // Almacenar en caché el resultado
        this.cachedCategoriasByDepartamento.set(idDepartamento, categoriasWithProductos)
        return categoriasWithProductos
      } catch (error) {
        console.error(`Error al obtener productos para categorías:`, error)

        // Devolver categorías sin productos si falla la obtención de productos
        const categoriasWithoutProductos = categorias.map((categoria) => ({
          ...categoria,
          productos: [],
        }))

        this.cachedCategoriasByDepartamento.set(idDepartamento, categoriasWithoutProductos)
        return categoriasWithoutProductos
      }
    } catch (error) {
      console.error(`Error al obtener categorías para departamento ${idDepartamento}:`, error)
      return undefined
    }
  }

  // Método para limpiar caché si es necesario
  clearCache() {
    this.cachedCategorias = null
    this.cachedCategoriaById.clear()
    this.cachedCategoriasByDepartamento.clear()
  }
}
