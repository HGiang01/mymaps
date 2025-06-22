import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Khởi tạo ứng dụng
@Injectable({
  providedIn: 'root',
})

export class AuthService {
  private apiUrl = 'https://mymaps-app-1.onrender.com/';

  //Trạng thái đăng nhập của loggedIn sẽ là false từ ban đầu khi chưa đăng nhập
  private loggedIn = new BehaviorSubject<boolean>(false);

  //Cho phép các component bên ngoài subcrise
  isLoggedIn$ = this.loggedIn.asObservable();

  //Lưu biến username
  private username = new BehaviorSubject<string | null>(null);
  username$ = this.username.asObservable();

  //Cho phép các component bên ngoài subcrise
  private userId = new BehaviorSubject<string | null>(null);
  user_id$ = this.userId.asObservable();

  //Lưu biến avatar vào localstorage
  private avatarUrlSubject = new BehaviorSubject<string | null>(localStorage.getItem('user_avatar'));
  avatarUrl$ = this.avatarUrlSubject.asObservable();

  // Subject để thông báo token hết hạn
  private tokenExpiredSubject = new BehaviorSubject<boolean>(false);
  tokenExpired$ = this.tokenExpiredSubject.asObservable();

  //Khởi tạo khi vừa thực hiện
  constructor(private http: HttpClient) {
    const savedLogin = localStorage.getItem('loggedIn') === 'true';
    this.loggedIn.next(savedLogin);

    this.initializeUserInfo(); // Load thông tin khi service khởi tạo
  }

  //Lấy thông tin từ localStorage
  initializeUserInfo(): void {
    const savedUserId = localStorage.getItem('userId');
    const savedUsername = localStorage.getItem('username');
    const savedAvatar = localStorage.getItem('user_avatar');

    if (savedUserId) this.userId.next(savedUserId);
    if (savedUsername) this.username.next(savedUsername);
    if (savedAvatar) this.avatarUrlSubject.next(savedAvatar);
  }

  //Cập nhật avatar
  setAvatarUrl(url: string | null): void {
    if (url) {
      localStorage.setItem('user_avatar', url);
    } else {
      localStorage.removeItem('user_avatar');
    }
    this.avatarUrlSubject.next(url);
  }

  // Kiểm tra token có hợp lệ không
  isTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Decode JWT token để kiểm tra expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        this.handleTokenExpiration();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Lỗi khi kiểm tra token:', error);
      this.handleTokenExpiration();
      return false;
    }
  }

  // Xử lý khi token hết hạn
  handleTokenExpiration(): void {
    console.log('Token đã hết hạn, đăng xuất người dùng');
    this.logout();
    this.tokenExpiredSubject.next(true);
  }

  // Reset trạng thái token expired
  resetTokenExpiredStatus(): void {
    this.tokenExpiredSubject.next(false);
  }

  // Kiểm tra và refresh token nếu cần
  checkAndRefreshToken(): Observable<boolean> {
    if (!this.isTokenValid()) {
      return throwError(() => new Error('Token không hợp lệ'));
    }

    // Gọi API để kiểm tra token
    return this.http.get<any>(`${this.apiUrl}users/me`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => {
        // Token vẫn hợp lệ
        this.resetTokenExpiredStatus();
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          this.handleTokenExpiration();
        }
        return throwError(() => error);
      })
    );
  }

  getIsLoggedIn(): boolean {
    return this.loggedIn.value;
  }

  getUsername(): string | null {
    return this.username.value;
  }

  getUserId(): string | null {
    return this.userId.value;
  }

  //Lưu thông tin người dùng
  setUserInfo(userId: string, username: string): void {
    this.userId.next(userId);
    this.username.next(username);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
  }

  //Làm mới thông tin người dùng từ LocalStorage
  refreshUserInfoFromStorage(): void {
    const userId = localStorage.getItem('userId') || '';
    const username = localStorage.getItem('username') || '';
    const avatar = localStorage.getItem('user_avatar') || '';

    this.setUserInfo(userId, username);
    this.setAvatarUrl(avatar);
  }

  //Gửi thông tin đăng ký
  register(data: { username: string; email: string; password: string }): Observable<any> {
    const body = new URLSearchParams();
    body.set('user_name', data.username);
    body.set('user_password', data.password);
    body.set('user_email', data.email);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}user/signin`, body.toString(), { headers });
  }

  //Gửi thông tin đăng nhập
  login(credentials: { username: string; password: string }): Observable<any> {
    const body = new URLSearchParams();
    body.set('username', credentials.username);
    body.set('password', credentials.password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}token`, body.toString(), { headers }).pipe(
      tap((response: any) => {
        if (response && response.access_token) {
          localStorage.setItem('loggedIn', 'true');
          localStorage.setItem('access_token', response.access_token);
          this.loggedIn.next(true);
          this.resetTokenExpiredStatus(); // Reset trạng thái token expired

          // Gọi API /users/me để lấy thông tin người dùng chi tiết
          const authHeaders = new HttpHeaders({
            'Authorization': `Bearer ${response.access_token}`,
            'Accept': 'application/json'
          });

          this.http.get<any>(`${this.apiUrl}users/me`, { headers: authHeaders }).subscribe({
            next: (res) => {
              localStorage.setItem('userId', res.user_id);
              localStorage.setItem('username', res.username);
              localStorage.setItem('user_email', res.user_email || '');
              localStorage.setItem('user_phone', res.user_phone || '');
              localStorage.setItem('user_avatar', res.avatar || '');

              this.setUserInfo(res.user_id, res.username);
              this.setAvatarUrl(res.avatar || null);
            },
            error: (err) => {
              console.error('Lỗi khi gọi /users/me:', err);
            }
          });
        }
      })
    );
  }

  //Đăng xuất và xóa thông tin khỏi localStorage
  logout(): void {
    // Xóa tất cả các key liên quan
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('access_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_phone');
    localStorage.removeItem('displayName');

    // Reset các BehaviorSubject về null/false
    this.loggedIn.next(false);
    this.username.next(null);
    this.userId.next(null);
    this.avatarUrlSubject.next(null);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    });
  }

  // Cập nhật trạng thái Login
  setLoginStatus(status: boolean): void {
    this.loggedIn.next(status);
    localStorage.setItem('loggedIn', status.toString());
  }

  // Cập nhật trạng thái username
  setUsername(username: string | null): void {
    this.username.next(username);
    if (username) {
      localStorage.setItem('username', username);
    } else {
      localStorage.removeItem('username');
    }
  }
}
