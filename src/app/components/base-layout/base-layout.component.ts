import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, MenuController } from '@ionic/angular'; 
import { Router } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';

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
    private authService: AuthService
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

  logout() {
    this.authService.logout();
    this.menu.close('main-menu');
    this.router.navigate(['/login']);
  }
}