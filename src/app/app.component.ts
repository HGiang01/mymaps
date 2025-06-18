import { Component, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Platform, AlertController, IonRouterOutlet, MenuController } from '@ionic/angular';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Location } from '@angular/common';
import { App } from '@capacitor/app';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { register } from 'swiper/element/bundle';
import { ModalController } from '@ionic/angular';
import { ContactPage } from './pages/contact/contact.page';

register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  avatarUrl: string | null = null;
  isLoggedIn = false;
  appPages: any[] = [];
  username: string | null = null;
  userId: string | null = null;
  isModalOpen = false;

  private subscriptions: Subscription[] = [];

  @ViewChild(IonRouterOutlet, { static: true }) routerOutlet!: IonRouterOutlet;

  constructor(
    public authService: AuthService,
    private platform: Platform,
    private alertController: AlertController,
    private location: Location,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private menu: MenuController,
    private modalCtrl: ModalController,
  ) {
    this.initializeApp();
    this.backButtonEvent();
  }

  async presentContactModal() {
    const modal = await this.modalCtrl.create({
      component: ContactPage,
    });
    return await modal.present();
  }

  presentModal() {
    this.isModalOpen = true;
  }

  initializeApp() {
    this.platform.ready().then(() => {
      if (this.platform.is('capacitor')) {
        StatusBar.setStyle({ style: Style.Default }).catch(() => {});
        SplashScreen.hide().catch(() => {});
      }
    });
  }

  backButtonEvent() {
    this.platform.backButton.subscribeWithPriority(10, () => {
      if (!this.routerOutlet.canGoBack()) {
        this.backButtonAlert();
      } else {
        this.location.back();
      }
    });
  }

  async backButtonAlert() {
    const alert = await this.alertController.create({
      message: 'Bạn muốn thoát khỏi ứng dụng?',
      buttons: [
        { text: 'Hủy', role: 'cancel' },
        {
          text: 'Thoát',
          handler: () => {
            App.exitApp();
          },
        },
      ],
    });

    await alert.present();
  }

  updateMenu() {
    this.appPages = this.isLoggedIn
      ? [
          { title: 'Cài đặt', url: 'settings', icon: 'settings' },
          { title: 'Đăng xuất', url: '', icon: 'log-out', action: 'logout' },
        ]
      : [
          { title: 'Đăng ký', url: 'register', icon: 'person-add' },
          { title: 'Đăng nhập', url: 'login', icon: 'log-in' },
        ];
  }

  ngOnInit() {
    this.subscriptions.push(
      this.authService.isLoggedIn$
        .pipe(distinctUntilChanged())
        .subscribe((status) => {
          this.isLoggedIn = status;
          this.updateMenu();
          this.cdr.detectChanges();
        }),

      this.authService.username$.subscribe(name => {
        this.username = name;
        this.cdr.detectChanges();
      }),

      this.authService.userId$.subscribe(id => {
        this.userId = id;
        this.cdr.detectChanges();
      }),

      this.authService.avatarUrl$.subscribe(url => {
        this.avatarUrl = url || 'assets/img/avatar.jpg';
        this.cdr.detectChanges();
      })
    );

    if (this.authService.getIsLoggedIn()) {
      this.authService.refreshUserInfoFromStorage();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  trackByFn(index: number, item: any): any {
    return item.url;
  }

  onMenuClosed() {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.blur();
    }
  }

  logout() {
    this.menu.close().then(() => {
      this.authService.logout();
      this.router.navigate(['/login']);
    });
  }

  // Mở menu khi nhấn avatar
  openMenu() {
    this.menu.open('main-menu');
  }

  // Điều hướng đến About Us
  navigateToAboutUs() {
    this.menu.close().then(() => {
      this.router.navigateByUrl('/about-us');
    });
  }
}
