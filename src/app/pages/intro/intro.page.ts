import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'intro.page.html',
  styleUrls: ['intro.page.scss'],
  standalone: false,
})
export class IntroPage implements OnInit {

  constructor(private navCtrl: NavController) {}

  ngOnInit() {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    if (hasSeenIntro) {
      // Nếu đã xem intro, chuyển thẳng sang login
      this.navCtrl.navigateRoot('/login');
      console.log('Đã xem intro rồi → chuyển sang login');
    }
  }

  handleExplore() {
    // Lưu trạng thái đã xem
    localStorage.setItem('hasSeenIntro', 'true');
    // Điều hướng sang login
    console.log('Chuyển sang login');
    // nếu có trang login gòi this.navCtrl.navigateRoot('/login');
    this.navCtrl.navigateRoot('/login');
  }
}