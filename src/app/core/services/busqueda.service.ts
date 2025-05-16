import { Injectable, type WritableSignal, inject, signal } from "@angular/core"
import type { BusquedaResult, Busqueda } from "../interfaces/busqueda"
import type { Categoria } from "../interfaces/categoria"
import type { Producto } from "../interfaces/producto"
import { CategoriasService } from "./categorias.service"
import { DepartamentosService } from "./departamentos.service"
import { ProductosService } from "./productos.service"
import type { Departamento } from "../interfaces/departamento"

@Injectable({
  providedIn: "root",
})
export class BusquedaService {
  categorias: Categoria[] = []
  productos: Producto[] = []
  categoriasService = inject(CategoriasService)
  departamentosService = inject(DepartamentosService)
  productosService = inject(ProductosService)
  departamentos: Departamento[] = []

  busqueda: WritableSignal<Busqueda> = signal({ texto: "" })

  constructor() {}

  // Mejorar el método buscar para que funcione correctamente
  async buscar(busqueda: Busqueda): Promise<BusquedaResult> {
    // Guardar la búsqueda actual
    this.busqueda.set(busqueda)

    try {
      // Limpiar resultados anteriores
      this.productos = []
      this.categorias = []
      this.departamentos = []

      // Texto de búsqueda normalizado (minúsculas y sin espacios extras)
      const texto = busqueda.texto.toLowerCase().trim()

      if (texto.length < 2) {
        // Evitar búsquedas con texto muy corto
        return {
          departamentos: [],
          categorias: [],
          productos: [],
        }
      }

      // Buscar departamentos
      const departamentosFound = await this.departamentosService.getAll()
      this.departamentos = departamentosFound.filter((dpto) => dpto.nombre.toLowerCase().includes(texto))

      // Buscar categorías
      const categoriasFound = await this.categoriasService.getAll()
      this.categorias = categoriasFound.filter((categoria) => categoria.nombre.toLowerCase().includes(texto))
      console.log(this.categorias)

      if(this.categorias.length > 0){
        for (let categoria of this.categorias){
          const productos = await this.productosService.getByCategoria(categoria.idCategoria);
          if(productos){
            categoria.productos = productos;
          }
        }
      }

      // Obtener IDs de categorías encontradas para evitar duplicados
      const categoriaIds = this.categorias.map((cat) => cat.idCategoria)

      // Buscar productos
      const productosFound = await this.productosService.getByBusqueda(busqueda)
      console.log(productosFound);

      // Filtrar productos para evitar duplicados con categorías
      this.productos = productosFound.filter(
        (producto) => !producto.idCategoria || !categoriaIds.includes(producto.idCategoria),
      )

      return {
        departamentos: this.departamentos,
        categorias: this.categorias,
        productos: this.productos,
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error)
      return {
        departamentos: [],
        categorias: [],
        productos: [],
      }
    }
  }

  async getResultados(busqueda: Busqueda) {
    this.productos = []
    this.categorias = []
    this.departamentos = []

    // Buscar categorías que coincidan con el texto de búsqueda
    const categoriasFound = await this.categoriasService.getAll()
    categoriasFound.forEach((categoria) => {
      if (categoria.nombre.toLowerCase().includes(busqueda.texto.toLowerCase())) {
        this.categorias.push(categoria)
      }
    })

    // Obtener IDs de categorías encontradas para evitar duplicados
    const ids = this.categorias.map((cat) => cat.idCategoria)

    // Buscar productos que coincidan con el texto de búsqueda
    const productosFound = await this.productosService.getByBusqueda(busqueda)
    productosFound.forEach((producto) => {
      if (!ids.includes(producto.idCategoria ? producto.idCategoria : -4000)) {
        this.productos.push(producto)
      }
    })

    // Buscar departamentos que coincidan con el texto de búsqueda
    const departamentosFound = await this.departamentosService.getAll()
    departamentosFound.forEach((dpto) => {
      if (dpto.nombre.toLowerCase().includes(busqueda.texto.toLowerCase())) {
        this.departamentos.push(dpto)
      }
    })
  }
}
