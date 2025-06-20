import { Component, ViewChild, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Platform,  AlertController,  IonRouterOutlet, MenuController} from '@ionic/angular';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Location } from '@angular/common';
import { App } from '@capacitor/app';
import { AuthService } from './services/auth.service';
import { TokenCheckerService } from './services/token-checker.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import { register } from 'swiper/element/bundle';

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
  showMenuButton = false;

  private subscriptions: Subscription[] = [];

  @ViewChild(IonRouterOutlet, { static: true }) routerOutlet!: IonRouterOutlet;

  constructor(
    public authService: AuthService,
    private tokenCheckerService: TokenCheckerService,
    private platform: Platform,
    private alertController: AlertController,
    private location: Location,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private menu: MenuController,
  ) {
    this.initializeApp();
    this.backButtonEvent();
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
        { text: 'Cancel', role: 'cancel' },
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
    // Lấy dữ liệu từ AuthService (Observable) và gán vào biến local
    this.subscriptions.push(
      this.authService.isLoggedIn$
        .pipe(distinctUntilChanged())
        .subscribe((status) => {
          this.isLoggedIn = status;
          this.updateMenu();
          this.cdr.detectChanges();
          this.showMenuButton = status && this.router.url.startsWith('/tabs');
          
          // Khởi động/dừng token checker dựa trên trạng thái đăng nhập
          if (status) {
            this.tokenCheckerService.restartTokenChecking();
          } else {
            this.tokenCheckerService.stopTokenChecking();
          }
        }),

      this.authService.username$.subscribe(name => {
        this.username = name;
        this.cdr.detectChanges();
      }),

      this.authService.user_id$.subscribe(id => {
        this.userId = id;
        this.cdr.detectChanges();
      }),

      this.authService.avatarUrl$.subscribe(url => {
        this.avatarUrl = url || 'assets/img/avatar.jpg';
        this.cdr.detectChanges();
      })
    );

    // Nếu user đang đăng nhập, lấy lại thông tin ban đầu từ localStorage
    if (this.authService.getIsLoggedIn()) {
      this.authService.refreshUserInfoFromStorage();
    }

    // Theo dõi thay đổi route để cập nhật showMenuButton
    this.router.events.subscribe(() => {
      this.showMenuButton = this.isLoggedIn && this.router.url.startsWith('/tabs');
      this.cdr.detectChanges();
    });
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

  // logout() {
  //   this.menu.close().then(() => {
  //   this.authService.logout();
  //   this.router.navigate(['/login']);
  //   });
  // }
}
