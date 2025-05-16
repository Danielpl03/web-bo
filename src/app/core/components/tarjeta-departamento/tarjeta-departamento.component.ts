import { Component, Input, type OnInit } from "@angular/core"
import type { Departamento } from "../../interfaces/departamento"
import { CommonModule } from "@angular/common"
import { IMAGES_DEPARTAMENTOS } from "../../constants"

@Component({
  selector: "app-tarjeta-departamento",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./tarjeta-departamento.component.html",
  styleUrl: "./tarjeta-departamento.component.css",
})
export class TarjetaDepartamentoComponent implements OnInit {
  @Input({ required: true }) departamento!: Departamento
  url: string = IMAGES_DEPARTAMENTOS
  backgroundImage = ""

  ngOnInit() {
    this.loadBackgroundImage()
  }

  loadBackgroundImage() {
    const img = new Image()
    img.onload = () => {
      this.backgroundImage = this.getImage()
    }
    img.onerror = () => {
      this.backgroundImage = "/descargar.jpg" // Imagen por defecto
    }
    img.src = this.getImage()
  }

  getImage() {
    if (this.departamento.image_name) {
      const image = this.departamento.image_name.replaceAll(" ", "_").split(".")[0]

      return this.url + image.replaceAll("&", "_")
    }

    return "/descargar.jpg"
  }
}
