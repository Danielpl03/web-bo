import { Injectable } from "@angular/core"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { environment } from "../../environments/environment"

// Definir interfaces para los tipos de consulta
interface QueryFilter {
  column: string
  operator: string
  value: any
}

interface QueryOrder {
  column: string
  ascending: boolean
}

interface QueryPagination {
  from: number
  to: number
}

interface QueryOptions {
  filters?: QueryFilter[]
  order?: QueryOrder
  pagination?: QueryPagination
}

@Injectable({
  providedIn: "root",
})
export class SupabaseService {
  private supabase: SupabaseClient

  constructor() {
    // Inicializar cliente Supabase con variables de entorno desde environment
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey)
  }

  /**
   * Obtener la instancia del cliente Supabase
   */
  getClient(): SupabaseClient {
    return this.supabase
  }

  async fetchAll(table: string, query: QueryOptions = {}): Promise<any[]> {
    let hasMore = true;
    const limit = 1000;
    let pagination: QueryPagination = {
      from: 0,
      to: limit-1,
    };

    let allData: any[] = [];

    while (hasMore) {
      query.pagination = pagination;

      const data = await this.fetch(table, query);
      console.log(data.length, data)
      allData = [...allData, ...data]

      if(data.length < limit){
        hasMore = false;
      }else{
        pagination.from = pagination.to + 1;
        pagination.to = pagination.from + limit -1;
      }
    }
    return allData;
  }

  /**
   * Obtener datos de una tabla
   * @param table Nombre de la tabla
   * @param query Parámetros de consulta opcionales
   */
  async fetch(table: string, query: QueryOptions = {}): Promise<any[]> {
    let queryBuilder = this.supabase.from(table).select()

    // Aplicar filtros si se proporcionan
    if (query.filters && query.filters.length > 0) {
      for (const filter of query.filters) {
        // Manejar cada operador de manera específica
        switch (filter.operator) {
          case "in":
            queryBuilder = queryBuilder.in(filter.column, Array.isArray(filter.value) ? filter.value : [filter.value])
            break
          case "eq":
            queryBuilder = queryBuilder.eq(filter.column, filter.value)
            break
          case "neq":
            queryBuilder = queryBuilder.neq(filter.column, filter.value)
            break
          case "gt":
            queryBuilder = queryBuilder.gt(filter.column, filter.value)
            break
          case "gte":
            queryBuilder = queryBuilder.gte(filter.column, filter.value)
            break
          case "lt":
            queryBuilder = queryBuilder.lt(filter.column, filter.value)
            break
          case "lte":
            queryBuilder = queryBuilder.lte(filter.column, filter.value)
            break
          case "like":
            queryBuilder = queryBuilder.like(filter.column, filter.value)
            break
          case "ilike":
            queryBuilder = queryBuilder.ilike(filter.column, filter.value)
            break
          default:
            // Para otros operadores, usar el método genérico
            console.warn(`Operador no manejado específicamente: ${filter.operator}`)
            // Omitir el filtro para evitar errores
            break
        }
      }
    }

    // Aplicar orden si se proporciona
    if (query.order) {
      queryBuilder = queryBuilder.order(query.order.column, { ascending: query.order.ascending })
    }

    // Aplicar paginación si se proporciona
    if (query.pagination) {
      queryBuilder = queryBuilder.range(query.pagination.from, query.pagination.to)
    }

    const { data, error } = await queryBuilder

    if (error) {
      console.error("Error al obtener datos de Supabase:", error)
      throw error
    }

    return data || []
  }

  /**
   * Obtener un registro por ID
   * @param table Nombre de la tabla
   * @param id ID del registro
   * @param column Nombre de la columna ID (por defecto: 'id')
   */
  async fetchById(table: string, id: number, column = "id"): Promise<any | null> {
    const { data, error } = await this.supabase.from(table).select().eq(column, id).single()

    if (error) {
      console.error(`Error al obtener ${table} con ${column}=${id}:`, error)
      return null
    }

    return data
  }

  /**
   * Obtener registros con relación a otra tabla
   * @param table Nombre de la tabla principal
   * @param relationTable Nombre de la tabla relacionada
   * @param foreignKey Columna de clave foránea
   * @param id ID para filtrar
   */
  async fetchWithRelation(table: string, relationTable: string, foreignKey: string, id: number): Promise<any[]> {
    const { data, error } = await this.supabase.from(table).select(`*, ${relationTable}(*)`).eq(foreignKey, id)

    if (error) {
      console.error(`Error al obtener ${table} con relación a ${relationTable}:`, error)
      return []
    }

    return data || []
  }
}
