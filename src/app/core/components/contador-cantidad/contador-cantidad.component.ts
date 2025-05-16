import { Component, EventEmitter, Input, OnInit, Output, WritableSignal, signal } from '@angular/core';

@Component({
  selector: 'app-contador-cantidad',
  standalone: true,
  imports: [],
  templateUrl: './contador-cantidad.component.html',
  styleUrl: './contador-cantidad.component.css'
})
export class ContadorCantidadComponent implements OnInit{
  ngOnInit(): void {
    this.numero.set(this.cantidadInicial);
  }

  @Output() cantidad = new EventEmitter<number>();
  @Input({required:true}) cantidadInicial!: number; 


  numero : WritableSignal<number> = signal(this.cantidadInicial);

  actualizarNumero( valor: number ){
    this.numero.set( Math.max(this.numero()+valor, 1) );
    this.cantidad.emit( this.numero() );

  }


}
