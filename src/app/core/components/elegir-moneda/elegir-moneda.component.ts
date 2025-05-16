import { Component, type OnInit, computed, inject } from "@angular/core"
import type { Moneda } from "../../interfaces/producto"
import { CarritoService } from "../../services/carrito.service"
import { MonedaService } from "../../services/moneda.service"

@Component({
  selector: "app-elegir-moneda",
  standalone: true,
  imports: [],
  templateUrl: "./elegir-moneda.component.html",
  styleUrl: "./elegir-moneda.component.css",
})
export class ElegirMonedaComponent implements OnInit {
  ngOnInit(): void {
    this.monedasService.getMonedas().then((monedas) => {
      this.monedas = monedas
    })
  }

  monedas: Moneda[] = []
  carritoService = inject(CarritoService)
  monedasService = inject(MonedaService)
  moneda = computed(() => this.monedasService.moneda())

  // @Output() idMoneda = new EventEmitter<Moneda>();

  cambiarMoneda() {
    if (this.moneda()?.idMoneda == 1) {
      this.monedasService.updateMoneda(this.monedas[1])
      // Forzar actualización del carrito
      this.carritoService.forzarActualizacion()
    } else {
      this.monedasService.updateMoneda(this.monedas[0])
      // Forzar actualización del carrito
      this.carritoService.forzarActualizacion()
    }
  }
}
