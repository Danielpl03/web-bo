export interface Moneda {
  idMoneda: number
  siglas: string
  nombre: string
  tazaCambio: number
  descuentos?: number[] // IDs de descuentos disponibles para esta moneda (a través de sus métodos de pago)
}

export interface Precio {
  idPrecio: number
  idProducto: number
  idMoneda: number
  precio: number
}

export interface Descuento {
  idDescuento: number
  color: number
  valor: number
  nombre: string
  activo: boolean
}

export interface DescuentoPago {
  idRelacion: number
  idDescuento: number
  idPago: number // ID del método de pago, no de la moneda
}

export interface MetodoPago {
  idPago: number
  tipoPago: string // Nombre del metodo de pago
  idMoneda: number // Moneda a la que pertenece este método de pago
  efectivo: boolean
}

export interface EtiquetaProducto {
  idRelacion: number
  idEtiqueta: number
  idProducto: number
  valor: string
}

export interface Producto {
  idProducto: number
  idDepartamento: number
  codigo?: string
  descripcion: string
  image_name?: string
  ipv: boolean
  activo: boolean
  combo: boolean
  precio?: Precio
  precios: Precio[]
  idCategoria?: number
  movimientos?: any[]
  etiquetasProductos?: EtiquetaProducto[]
  descuentos?: Descuento[]
  stocks?: number[]
  created_at?: string
}
