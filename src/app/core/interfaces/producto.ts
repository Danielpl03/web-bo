export interface Moneda {
    idMoneda: number
    siglas: string
    nombre: string
    tazaCambio: number
    descuentos?: number[] // IDs de descuentos asociados a esta moneda
  }

  export interface Pago {
    idPago: number
    tipoPago: string
    idMoneda: number
    efectivo: boolean
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
    idPago: number
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
  