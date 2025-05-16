import { Moneda, Producto } from "./producto";

export interface ItemCarrito {
    producto: Producto,
    cantidad: number,
    importe: number,
}

export interface Carrito {
    id: number,
    moneda: Moneda | undefined,
    items: ItemCarrito[]
}

