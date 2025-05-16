import { Component, OnInit, WritableSignal, inject, signal } from '@angular/core';
import { Categoria } from '../../core/interfaces/categoria';
import { CategoriasService } from '../../core/services/categorias.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductosService } from '../../core/services/productos.service';
import { Producto } from '../../core/interfaces/producto';
import { ProductoComponent } from "../producto/producto.component";
import { CommonModule } from '@angular/common';
import { TarjetaProductoComponent } from '../../core/components/tarjeta-producto/tarjeta-producto.component';

@Component({
  selector: 'app-categoria',
  standalone: true,
  imports: [RouterModule, ProductoComponent, CommonModule, TarjetaProductoComponent],
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.css'
})
export class CategoriaComponent implements OnInit{

  ngOnInit(): void {
    this.ac.params.subscribe( params => {
      if (params['id']){
        this.categoriasService.getById(parseInt (params['id'])).then(cat => {
          this.categoria = cat;
          if (this.categoria){
            this.getProductosByCategoria(this.categoria.idCategoria);
          }else{
            this.router.navigate(['categorias']);
          }
        });
      }
    })
  }

  constructor( private router: Router){}

  ac = inject(ActivatedRoute)
  categoria?: Categoria
  productos: WritableSignal<Producto[] | undefined> = signal(undefined)
  categoriasService = inject(CategoriasService);
  productosService = inject(ProductosService);


  async getProductosByCategoria(id: number){
    this.productos.set(await this.productosService.getByCategoria(id)) ;
  }



}
