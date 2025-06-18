import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    FormsModule,
    CommonModule
  ]
})

//Xử lý logic bằng implements OnInit
export class ProfilePage implements OnInit {
  isEditing = false;

  user = {
    username: '',
    id: '',
    email: '',
    avatar: '',
    displayName: '',

  };

  avatarPreview: string | ArrayBuffer | null = null;
  selectedAvatarFile: File | null = null;

  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef;

  //Xử lý dữ liệu bên service
  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.fetchUserInfo();
  }

  // Lấy dữ liệu người dùng từ server fecthUserInfo()
  fetchUserInfo() {
    const headers = this.authService.getAuthHeaders();
    this.http.get<any>('https://mymaps-app.onrender.com/users/me', { headers }).subscribe({ //lấy dữ liệu <get> từ users/me -> kết quả trả về -> lấy kết quả đó
      next: (res) => {
        // Gán dữ liệu trả về
        this.user.id = res.user_id;
        this.user.username = res.username;
        this.user.displayName = res.username;
        this.user.email = res.user_email || '';
        this.user.avatar = res.avatar || '';

        this.avatarPreview = this.user.avatar;

        // Đồng bộ với AuthService
        this.authService.setUserInfo(res.user_id, res.username);
        this.authService.setAvatarUrl(this.user.avatar);

        // Lưu localStorage
        localStorage.setItem('username', this.user.username);
        localStorage.setItem('userId', this.user.id);
        localStorage.setItem('displayName', this.user.username);
        localStorage.setItem('user_email', this.user.email);
        localStorage.setItem('user_avatar', this.user.avatar);
      },
      error: (err) => {
        console.error('Lỗi lấy thông tin người dùng:', err);
      }
    });
  }
  
  // Chỉnh sửa thông tin người dùng
  toggleEdit() {
    if (this.isEditing) {
      this.saveProfile();
    }
    this.isEditing = !this.isEditing;
  }

  // Chỉnh sửa ảnh
  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  //Chọn file
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedAvatarFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }


  //Lưu lại thông tin
  saveProfile() {
  const headers = this.authService.getAuthHeaders();
  const updatedData = {
    user_email: this.user.email,
    avatar: this.user.avatar,
  };

  this.http.put('https://mymaps-app.onrender.com/users/me', updatedData, { headers }).subscribe({
    next: (res) => {
      alert('Cập nhật thành công');
      this.isEditing = false;

      // Lưu localStorage
      localStorage.setItem('user_email', this.user.email);
      localStorage.setItem('user_avatar', this.user.avatar);
    },
    error: (err) => {
      console.error('Lỗi cập nhật thông tin:', err);
      alert('Cập nhật thất bại');
    }
  });
}

}
