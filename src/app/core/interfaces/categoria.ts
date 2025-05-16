import { Producto } from "./producto";

export interface Categoria{
    idDepartamento: number;
    idCategoria: number;
    nombre: string;
    image_name?: string;
    productos?: Producto[]; //opcional
}