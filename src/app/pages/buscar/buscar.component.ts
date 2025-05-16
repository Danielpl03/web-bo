import { Component, type OnDestroy, type OnInit, type WritableSignal, inject, signal } from "@angular/core"
import type { Busqueda, BusquedaResult } from "../../core/interfaces/busqueda"
import { ActivatedRoute, Router, RouterModule } from "@angular/router"

import { TarjetaCategoriaComponent } from "../../core/components/tarjeta-categoria/tarjeta-categoria.component"
import { TarjetaDepartamentoComponent } from "../../core/components/tarjeta-departamento/tarjeta-departamento.component"
import { TarjetaProductoComponent } from "../../core/components/tarjeta-producto/tarjeta-producto.component"

import { BusquedaService } from "../../core/services/busqueda.service"
import { LoadingComponent } from "../../core/components/loading/loading.component"
import { SeoService } from "../../core/services/seo.service"
import { ProductosService } from "../../core/services/productos.service"
import { ElegirMonedaComponent } from "../../core/components/elegir-moneda/elegir-moneda.component"
import { CarritoService } from "../../core/services/carrito.service"

@Component({
  selector: "app-buscar",
  standalone: true,
  imports: [
    LoadingComponent,
    RouterModule,
    TarjetaCategoriaComponent,
    TarjetaDepartamentoComponent,
    TarjetaProductoComponent,
    ElegirMonedaComponent,
  ],
  templateUrl: "./buscar.component.html",
  styleUrl: "./buscar.component.css",
})
export class BuscarComponent implements OnInit, OnDestroy {
  seo = inject(SeoService)
  carritoService = inject(CarritoService)
  // moneda = computed( ()  => this.carritoService.moneda() );

  ngOnInit(): void {
    this.ac.params.subscribe((params) => {
      if (params["texto"]) {
        const text: string = params["texto"]
        if (text.trim().length > 0) {
          this.busqueda.texto = text.trim()
          this.buscar(this.busqueda)

          this.seo.title.setTitle(`Resultados para ${this.busqueda.texto} | M&L SOLUCIONES`)
          this.seo.meta.updateTag({
            name: "description",
            content: `Resultados para ${this.busqueda.texto} en M&L SOLUCIONES`,
          })
          this.seo.setCanonicalUrl(`buscar/${text}`)
          this.seo.setIndexFollow(true)
        }
      } else {
        this.busquedaService.busqueda().texto = ""
        this.router.navigate(["departamentos"])
      }
    })
  }

  constructor(private router: Router) {}
  ngOnDestroy(): void {
    this.busquedaService.busqueda().texto = ""
  }

  busquedaService = inject(BusquedaService)
  productosService = inject(ProductosService)
  busquedaResult = signal<BusquedaResult | undefined>(undefined)
  emptyResult = signal<boolean | undefined>(undefined)

  ac = inject(ActivatedRoute)
  busqueda: Busqueda = {
    texto: "",
  }

  searchCompleted: WritableSignal<boolean> = signal(false)

  async buscar(busqueda: Busqueda) {
    this.searchCompleted.set(false)

    try {
      const result = await this.busquedaService.buscar(busqueda)
      this.busquedaResult.set(result)

      console.log(this.busquedaResult)

      // Verificar si hay resultados
      const hayResultados =
        (result.departamentos && result.departamentos.length > 0) ||
        (result.categorias && result.categorias.length > 0) ||
        (result.productos && result.productos.length > 0)

      this.emptyResult.set(!hayResultados)
      this.searchCompleted.set(true)
    } catch (error) {
      console.error("Error en la búsqueda:", error)
      this.emptyResult.set(true)
      this.searchCompleted.set(true)
    }
  }
}
