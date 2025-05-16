import { Component, WritableSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../interfaces/usuario';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {

  usuario: Usuario = {
    id: 0,
    nombre:"",
    direccion: "",
    telefono: ""
  }

}
