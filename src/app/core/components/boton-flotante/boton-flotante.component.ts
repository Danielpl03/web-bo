import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-boton-flotante',
  standalone: true,
  imports: [],
  templateUrl: './boton-flotante.component.html',
  styleUrl: './boton-flotante.component.css'
})
export class BotonFlotanteComponent {

 isOpen = signal(false);

 close(){
  this.isOpen.set(false);
 }

 open(){
  this.isOpen.set(true);
 }



}
