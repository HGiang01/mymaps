import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { AboutUsComponent } from '../../components/about-us/about-us.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
  ]
})
export class SettingsPage {
  notificationsEnabled = true;
  selectedLanguage = 'vi';

  constructor(
    private alertCtrl: AlertController,
    private http: HttpClient,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private modalCtrl: ModalController
  ) {}

  async confirmDeleteAccount() {
    const alert = await this.alertCtrl.create({
      header: 'Xác nhận',
      message: 'Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.',
      buttons: [
        {
          text: 'Hủy',
          role: 'cancel'
        },
        {
          text: 'Xóa',
          handler: () => this.deleteAccount()
        }
      ]
    });

    await alert.present();
  }

  async deleteAccount() {
    const token = this.authService.getAccessToken();

    if (!token) {
      const toast = await this.toastCtrl.create({
        message: 'Không tìm thấy token. Vui lòng đăng nhập lại.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    try {
      await this.http.delete(`https://mymaps-app-1.onrender.com/users/delete`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).toPromise();

      this.authService.logout();

      const toast = await this.toastCtrl.create({
        message: 'Tài khoản đã bị xóa thành công.',
        duration: 2000,
        color: 'success'
      });
      await toast.present();

      this.navCtrl.navigateRoot('/login');

    } catch (error: any) {
      console.error('Lỗi xóa tài khoản:', error);
      const message = error?.error?.message || 'Lỗi khi xóa tài khoản. Vui lòng thử lại.';
      const toast = await this.toastCtrl.create({
        message,
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  editProfile() {
    this.navCtrl.navigateForward('/profile');
  }

  async openAboutUsModal() {
    const modal = await this.modalCtrl.create({
      component: AboutUsComponent
    });
    await modal.present();
  }
}
