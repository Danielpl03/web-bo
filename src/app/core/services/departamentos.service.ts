import { Injectable } from "@angular/core"
import type { Departamento } from "../interfaces/departamento"
import { SupabaseService } from "./supabase.service"

@Injectable({
  providedIn: "root",
})
export class DepartamentosService {
  private cachedDepartamentos: Departamento[] | null = null
  private cachedDepartamentoById: Map<number, Departamento> = new Map()

  constructor(private supabaseService: SupabaseService) { }

  async getAll(): Promise<Departamento[]> {
    // Devolver datos en caché si están disponibles
    if (this.cachedDepartamentos) {
      return this.cachedDepartamentos
    }

    try {
      // Crear una promesa que rechaza después de 5 segundos
      const timeoutPromise = new Promise<Departamento[]>((_, reject) => {
        setTimeout(() => reject(new Error("Tiempo de espera agotado al obtener departamentos")), 5000)
      })

      // Obtener departamentos de Supabase
      const fetchPromise = this.supabaseService.fetch("departamentos")

      // Carrera entre la obtención y el tiempo de espera
      const departamentosData = (await Promise.race([fetchPromise, timeoutPromise])) as any[]

      // Transformar los datos para que coincidan con la interfaz esperada
      const departamentos: Departamento[] = departamentosData.map((d) => ({
        idDepartamento: d.id_departamento,
        nombre: d.departamento,
        idDescuento: d.id_descuento,
        image_name: this.parseName(d.departamento), // Nombre de imagen predeterminado
      }))

      // Almacenar en caché el resultado
      this.cachedDepartamentos = departamentos
      return departamentos
    } catch (error) {
      console.error("Error al obtener departamentos:", error)
      // Devolver array vacío en lugar de lanzar para evitar fallos de renderizado
      return []
    }
  }

  parseName(name: string): string {
    const caracteres = '<>:\"/\\|?*';
    name = name.split('').map(c => caracteres.includes(c) ? '&' : c).join('');
    return name.replace(/ /g, '_');
  }

  async getById(idDepartamento: number): Promise<Departamento | undefined> {
    // Devolver datos en caché si están disponibles
    if (this.cachedDepartamentoById.has(idDepartamento)) {
      return this.cachedDepartamentoById.get(idDepartamento)
    }

    try {
      // Crear una promesa que rechaza después de 5 segundos
      const timeoutPromise = new Promise<Departamento | null>((_, reject) => {
        setTimeout(() => reject(new Error(`Tiempo de espera agotado al obtener departamento ${idDepartamento}`)), 5000)
      })

      // Obtener departamento por ID de Supabase
      const fetchPromise = this.supabaseService.fetchById("departamentos", idDepartamento, "id_departamento")

      // Carrera entre la obtención y el tiempo de espera
      const departamentoData = (await Promise.race([fetchPromise, timeoutPromise])) as any

      if (!departamentoData) {
        return undefined
      }

      // Transformar los datos para que coincidan con la interfaz esperada
      const departamento: Departamento = {
        idDepartamento: departamentoData.id_departamento,
        nombre: departamentoData.departamento,
        idDescuento: departamentoData.id_descuento,
        image_name: this.parseName(departamentoData.departamento), // Nombre de imagen predeterminado
      }

      // Obtener categorías para este departamento con tiempo de espera
      const categoriasTimeoutPromise = new Promise<any[]>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Tiempo de espera agotado al obtener categorías para departamento ${idDepartamento}`)),
          5000,
        )
      })

      const categoriasFetchPromise = this.supabaseService.fetch("categorias", {
        filters: [{ column: "id_departamento", operator: "eq", value: idDepartamento }],
      })

      const categoriasData = await Promise.race([categoriasFetchPromise, categoriasTimeoutPromise])

      // Transformar categorías
      const categorias = categoriasData.map((c: { id_categoria: any; nombre: any; id_departamento: any }) => ({
        idCategoria: c.id_categoria,
        nombre: c.nombre,
        idDepartamento: c.id_departamento,
        image_name: `categoria_${c.id_categoria}.jpg`, // Nombre de imagen predeterminado
      }))

      // Añadir categorías al departamento
      const departamentoWithCategorias = {
        ...departamento,
        categorias: categorias,
      }

      // Almacenar en caché el resultado
      this.cachedDepartamentoById.set(idDepartamento, departamentoWithCategorias)
      return departamentoWithCategorias
    } catch (error) {
      console.error(`Error al obtener departamento ${idDepartamento}:`, error)
      return undefined
    }
  }

  // Método para limpiar caché si es necesario
  clearCache() {
    this.cachedDepartamentos = null
    this.cachedDepartamentoById.clear()
  }
}
