import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-token-expired-modal',
  templateUrl: './token-expired-modal.component.html',
  styleUrls: ['./token-expired-modal.component.scss'],
  standalone: false,
  // imports: [CommonModule, IonicModule]
})
export class TokenExpiredModalComponent implements OnDestroy {
  showModal = false;
  private tokenExpiredSubscription: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.tokenExpiredSubscription = this.authService.tokenExpired$.subscribe(
      (expired) => {
        // Chỉ hiển thị modal nếu đã đăng nhập và token hết hạn
        this.showModal = expired && this.authService.getIsLoggedIn();
      }
    );
  }

  ngOnDestroy() {
    if (this.tokenExpiredSubscription) {
      this.tokenExpiredSubscription.unsubscribe();
    }
  }

  // Xử lý khi người dùng click nút đăng nhập lại
  onReLogin() {
    this.showModal = false;
    this.authService.resetTokenExpiredStatus();
    this.router.navigate(['/login']);
  }

  // Xử lý khi người dùng đóng modal
  onDismiss() {
    this.showModal = false;
    this.authService.resetTokenExpiredStatus();
  }
} 