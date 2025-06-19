import { Component, inject } from '@angular/core';
import { IonicModule, ModalController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  templateUrl: './feedback.page.html',
  styleUrls: ['./feedback.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule]
})
export class FeedbackPage {
  rating = 1;
  feedbackText = '';

  private modalCtrl = inject(ModalController);
  private http = inject(HttpClient);
  private alertCtrl = inject(AlertController);
  private authService: AuthService = inject(AuthService);

  setRating(value: number) {
    this.rating = value;
  }

  async submitFeedback() {
    const token = this.authService.getAccessToken();
    if (!token) {
      const alert = await this.alertCtrl.create({
        header: 'Chưa đăng nhập',
        message: 'Vui lòng đăng nhập để gửi phản hồi.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });

    const body = new URLSearchParams();
    body.set('rank', this.rating.toString());
    body.set('message', this.feedbackText);

    try {
      await this.http.post('https://mymaps-app.onrender.com/user/feedback', body.toString(), { headers }).toPromise();

      const alert = await this.alertCtrl.create({
        header: 'Thành công',
        message: 'Phản hồi của bạn đã được gửi.',
        buttons: ['OK']
      });
      await alert.present();

      await this.modalCtrl.dismiss({
        rating: this.rating,
        feedback: this.feedbackText
      });

    } catch (error) {
      const alert = await this.alertCtrl.create({
        header: 'Lỗi',
        message: 'Không gửi được phản hồi. Vui lòng thử lại sau.',
        buttons: ['OK']
      });
      await alert.present();
      console.error('Error submitting feedback:', error);
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
