import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Kiểm tra token trước khi gửi request
    if (this.authService.getIsLoggedIn() && !this.authService.isTokenValid()) {
      // Token hết hạn, xử lý logout
      this.authService.handleTokenExpiration();
      return throwError(() => new Error('Token đã hết hạn'));
    }

    // Tự động thêm token vào header nếu user đã đăng nhập
    if (this.authService.getIsLoggedIn()) {
      const token = this.authService.getAccessToken();
      if (token) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          // Token không hợp lệ hoặc hết hạn
          this.authService.handleTokenExpiration();
        }
        return throwError(() => error);
      })
    );
  }
} 