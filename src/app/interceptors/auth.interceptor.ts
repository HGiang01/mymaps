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
      // Token hết hạn, chỉ phát sự kiện
      this.authService.notifyTokenExpired();
      return throwError(() => new Error('Token đã hết hạn'));
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 || error.status === 403) {
          // Token không hợp lệ hoặc hết hạn, chỉ phát sự kiện
          this.authService.notifyTokenExpired();
        }
        return throwError(() => error);
      })
    );
  }
} 