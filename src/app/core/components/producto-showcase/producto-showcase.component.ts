import { Component, Input, OnInit, WritableSignal, computed } from '@angular/core';
import { Moneda, Producto } from '../../interfaces/producto';
import { CarritoService } from '../../services/carrito.service';
import { CommonModule } from '@angular/common';
import { IMAGES_PRODUCTOS } from '../../constants';
import { TarjetaProductoComponent } from "../tarjeta-producto/tarjeta-producto.component";

@Component({
  selector: 'app-producto-showcase',
  standalone: true,
  imports: [CommonModule, TarjetaProductoComponent, TarjetaProductoComponent],
  templateUrl: './producto-showcase.component.html',
  styleUrl: './producto-showcase.component.css'
})
export class ProductoShowcaseComponent implements OnInit{

  @Input() titulo: string = '';
  @Input() productos: Producto[] = [];
  isExpanded: boolean = false;
  monedaActual = computed( () => this.carritoService.moneda() );
  url: string = IMAGES_PRODUCTOS;

  constructor(
    private carritoService: CarritoService,
    // private monedaService: MonedaService
  ) {}

  ngOnInit() {
    // this.monedaService.monedaActual$.subscribe(moneda => {
    //   this.monedaActual = moneda;
    // });
  }

  toggleExpanded() {
    this.isExpanded = !this.isExpanded;
  }


}
