import { Component, type OnInit, type WritableSignal, inject, signal } from "@angular/core"
import { LoadingComponent } from "../../core/components/loading/loading.component"
import { DepartamentosService } from "../../core/services/departamentos.service"
import type { Departamento } from "../../core/interfaces/departamento"
import { DepartamentoComponent } from "../departamento/departamento.component"
import { TarjetaDepartamentoComponent } from "../../core/components/tarjeta-departamento/tarjeta-departamento.component"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { SeoService } from "../../core/services/seo.service"
import type { Tienda } from "../../core/interfaces/tienda"
import { ProductoShowcaseComponent } from "../../core/components/producto-showcase/producto-showcase.component"
import { ProductosService } from "../../core/services/productos.service"
import { ProductoCarruselComponent } from "../../core/components/producto-carrusel/producto-carrusel.component"
import type { Producto } from "../../core/interfaces/producto"

@Component({
  selector: "app-home",
  standalone: true,
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.css",
  imports: [
    ProductoShowcaseComponent,
    LoadingComponent,
    DepartamentoComponent,
    RouterModule,
    TarjetaDepartamentoComponent,
    CommonModule,
    ProductoCarruselComponent,
  ],
})
export class HomeComponent implements OnInit {
  departamentosService = inject(DepartamentosService)
  departamentos: WritableSignal<Departamento[]> = signal([])
  isLoading: WritableSignal<boolean> = signal(true)
  hasError: WritableSignal<boolean> = signal(false)
  errorMessage: WritableSignal<string> = signal("")

  // Productos destacados (etiqueta id 3)
  productosDestacados: WritableSignal<Producto[]> = signal([])
  productosDestacadosLoading: WritableSignal<boolean> = signal(true)

  // Productos rebajados (etiqueta id 2)
  productosRebajados: WritableSignal<Producto[]> = signal([])
  productosRebajadosLoading: WritableSignal<boolean> = signal(true)

  seo = inject(SeoService)
  productosService = inject(ProductosService)

  ngOnInit(): void {
    this.loadDepartamentos()
    this.loadProductosDestacados()
    this.loadProductosRebajados()
    this.seo.title.setTitle(`Página INICIO | M&L SOLUCIONES`)
    this.seo.meta.updateTag({ name: "description", content: `Página de inicio en M&L SOLUCIONES` })
    this.seo.setCanonicalUrl(`departamentos`)
    this.seo.setIndexFollow(true)
  }

  async loadProductosDestacados() {
    try {
      const productos = await this.productosService.getProductosDestacados()
      this.productosDestacados.set(productos)
      console.log("Productos destacados cargados:", productos)
    } catch (error) {
      console.error("Error al cargar productos destacados:", error)
    } finally {
      this.productosDestacadosLoading.set(false)
    }
  }

  async loadProductosRebajados() {
    try {
      const productos = await this.productosService.getProductosRebajados()
      this.productosRebajados.set(productos)
      console.log("Productos rebajados cargados:", productos)
    } catch (error) {
      console.error("Error al cargar productos rebajados:", error)
    } finally {
      this.productosRebajadosLoading.set(false)
    }
  }

  async loadDepartamentos() {
    this.isLoading.set(true)
    this.hasError.set(false)

    try {
      // Set a timeout to prevent blocking the rendering
      const timeoutPromise = new Promise<Departamento[]>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout loading departamentos")), 5000)
      })

      const fetchPromise = this.departamentosService.getAll()

      const departamentos = await Promise.race([fetchPromise, timeoutPromise])
      this.departamentos.set(departamentos)
    } catch (error) {
      console.error("Error loading departamentos:", error)
      this.hasError.set(true)
      this.errorMessage.set("No se pudieron cargar los departamentos. Por favor, intente de nuevo más tarde.")
      // Set empty array to prevent rendering failures
      this.departamentos.set([])
    } finally {
      this.isLoading.set(false)
    }
  }

  isExpanded = false

  tiendas: Tienda[] = [
    {
      idTienda: 1,
      nombre: "Amanecer",
      imageName: "tienda-Amanecer.jpg",
      direccion: "Calle Martí #128, Pinar del Río",
      coordenadas: "22.4144804, -83.6923232",
    },
    {
      idTienda: 2,
      nombre: "La Quincallera",
      imageName: "tienda-Quincallera.png",
      direccion: "Calle Martí #123, Pinar del Río",
      coordenadas: "22.4165366, -83.6991112",
    },
    {
      idTienda: 3,
      nombre: "La Mariposa",
      imageName: "tienda-Mariposa.png",
      direccion: "Calle Rafael Morales #14 E/ Calle Martí y Calle Máximo Gómez",
      coordenadas: "22.4157534, -83.6985201",
    },
  ]

  toggleExpanded() {
    this.isExpanded = !this.isExpanded
  }

  abrirEnMaps(coordenadas: string) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${coordenadas}`, "_blank")
  }

  // Retry loading if there was an error
  retryLoading() {
    this.loadDepartamentos()
  }
}
