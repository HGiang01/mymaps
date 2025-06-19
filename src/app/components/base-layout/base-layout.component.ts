import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, MenuController } from '@ionic/angular'; 
import { Router } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { FeedbackPage } from 'src/app/pages/feedback/feedback.page';
import { ModalController } from '@ionic/angular';
import { ContactPage } from 'src/app/pages/contact/contact.page';

@Component({
  selector: 'app-base-layout',
  standalone: false,
  templateUrl: './base-layout.component.html',
  styleUrls: ['./base-layout.component.scss'],
  // imports: [IonicModule]
})

export class BaseLayoutComponent implements OnInit {
  @Input() title: string = '';
  avatarUrl: string | null = null;
  username: string | null = null;
  
  constructor(
    private menu: MenuController,
    private router: Router,
    private authService: AuthService,
    public menuCtrl: MenuController,
    private modalCtrl: ModalController,
  ) {};

  ngOnInit() {
    this.avatarUrl = localStorage.getItem('user_avatar');
    this.authService.username$.subscribe(name => {
      this.username = name;
    });
  }

  openMenu() {
    this.menu.enable(true, 'main-menu'); 
    this.menu.open('main-menu');        
  }

  goToSettings() {
    this.menu.close('main-menu');
    this.router.navigate(['/settings']);
  }

  goToAboutUs() {
    this.menu.close('main-menu');
    this.router.navigate(['/about-us']);
  }

  goToFeedback() {
    this.router.navigate(['/feedback']);
    this.menuCtrl.close();
  }

  async goToContact() {
    const modal = await this.modalCtrl.create({
      component: ContactPage,
      cssClass: 'contact-modal-center',
      backdropDismiss: true,
      showBackdrop: true,
      animated: true
    });
    
    await modal.present();
  }

  async openFeedback() {
    const modal = await this.modalCtrl.create({
    component: FeedbackPage,
    cssClass: 'my-feedback-modal',
    backdropDismiss: true,
    showBackdrop: true,
    animated: true
  });
  
    modal.onWillDismiss().then(res => {
      if (res.data) {
        console.log('Feedback:', res.data);
        // TODO: gửi về API hoặc xử lý dữ liệu
      }
    });

    await modal.present();
  }

  logout() {
    this.authService.logout();
    this.menu.close('main-menu');
    this.router.navigate(['/login']);
  }
}