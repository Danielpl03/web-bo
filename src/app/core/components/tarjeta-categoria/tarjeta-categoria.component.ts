import { Component, Input, OnInit, Signal, WritableSignal, inject, signal } from '@angular/core';
import { Categoria } from '../../interfaces/categoria';
import { CommonModule } from '@angular/common';
import { TarjetaProductoComponent } from "../tarjeta-producto/tarjeta-producto.component";
import { Moneda, Producto } from '../../interfaces/producto';
import { ProductosService } from '../../services/productos.service';

@Component({
  selector: 'app-tarjeta-categoria',
  standalone: true,
  imports: [CommonModule, TarjetaProductoComponent],
  templateUrl: './tarjeta-categoria.component.html',
  styleUrl: './tarjeta-categoria.component.css'
})
export class TarjetaCategoriaComponent implements OnInit {

  ngOnInit(): void {
    this.getItems();
  }

  productosService = inject(ProductosService);

  productos: WritableSignal<Producto[] | undefined> = signal(undefined);
  cantidad: WritableSignal<number> = signal(0);

  @Input({ required: true }) categoria!: Categoria;
  localidades: number[] = [102, 103, 105];

  isExpanded: boolean = false;


  async getItems() {
    // this.productosService.getByCategoria(this.categoria.idCategoria).then(productos => {
    //   this.productos.set(productos);
    //   if (this.productos()) {
    //     this.cantidad.set(this.productos()!.length);
    //   }
    // })

    this.productos.set(this.categoria.productos?.filter(producto => {
      if (producto.stocks) {
        for (let index = 0; index < this.localidades.length; index++) {
          const element = producto.stocks[this.localidades[index]];
          if (element > 0) return true;
        }
      }
      return false;
    }))


    if(this.productos()){
      this.cantidad.set(this.productos()!.length);
    }else{
      this.cantidad.set(0);
    }
  }


  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }

}
