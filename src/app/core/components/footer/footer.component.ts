import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FACEBOOK_GROUP_LINK, WSP_LINK } from '../../constants';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {

  wspLink = WSP_LINK;
  faceGroupLink = FACEBOOK_GROUP_LINK;


  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  openWhatsApp(): void {
    window.open(`${this.wspLink}`, '_blank');
  }

  openFacebook(): void {
    window.open(this.faceGroupLink, '_blank');
  }

}
