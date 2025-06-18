import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonicModule, MenuController, ViewWillEnter, ViewWillLeave, IonSplitPane } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonicModule
  ],
})
export class LoginPage implements ViewWillEnter, ViewWillLeave {
  @ViewChild(IonSplitPane, { static: true }) splitPane!: IonSplitPane;

  showPassword: boolean = false;
  username = '';
  password = '';
  loginError = '';
  submitted = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private menu: MenuController
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  ionViewWillEnter(): void {
    // Tắt menu logic — menu không mở được
    this.menu.enable(false);
    // Tắt split-pane layout
    this.splitPane.disabled = true;
  }

  ionViewWillLeave(): void {
    // Bật lại menu logic
    this.menu.enable(true);
    // Phục hồi split-pane layout
    this.splitPane.disabled = false;
  }

  onSubmit(): void {
    this.submitted = true;
    this.loginError = '';

    if (!this.username || !this.password) {
      this.loginError = 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.';
      return;
    }

    const loginData = { username: this.username, password: this.password };
    this.authService.login(loginData).subscribe({
      next: (res: any) => {
        if (res.access_token) {
          this.authService.setLoginStatus(true);
          this.authService.setUsername(this.username);
          this.router.navigate(['/tabs']);
        } else {
          this.loginError = 'Đăng nhập không thành công.';
        }
      },
      error: () => {
        this.loginError ='Tài khoản hoặc mật khẩu không đúng!';
      }
    });
  }
}
