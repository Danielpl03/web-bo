import { Component, type OnInit, inject } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { RouterModule } from "@angular/router"
import { HeaderComponent } from "./core/components/header/header.component"
import { FooterComponent } from "./core/components/footer/footer.component"
import { BotonFlotanteComponent } from "./core/components/boton-flotante/boton-flotante.component"
import { SeoService } from "./core/services/seo.service"

@Component({
  selector: "app-root",
  standalone: true,
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
  imports: [RouterOutlet, RouterModule, HeaderComponent, FooterComponent, BotonFlotanteComponent],
})
export class AppComponent implements OnInit {
  title = "webML-app"

  seo = inject(SeoService)

  ngOnInit(): void {
    this.seo.title.setTitle("Página Inicio | M&L SOLUCIONES ")
    this.seo.meta.updateTag({ name: "description", content: "Página de Inicio de la Web de M&L SOLUCIONES" })
    this.seo.setCanonicalUrl("www.ml-soluciones.vercel.app")
    this.seo.setIndexFollow(true)
  }
}
