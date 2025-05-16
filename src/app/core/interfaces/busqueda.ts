import { Categoria } from "./categoria";
import { Departamento } from "./departamento";
import { Producto } from "./producto";

export interface Busqueda{
    texto: string;
}

export interface BusquedaResult{
    departamentos: Departamento[] | undefined;
    categorias: Categoria[] | undefined;
    productos: Producto[] | undefined;
}