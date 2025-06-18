import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, from } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getAccessToken();

    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Chuyển Promise alert -> Observable bằng from()
          return from(
            this.alertController.create({
              header: 'Phiên đăng nhập hết hạn',
              message: 'Vui lòng đăng nhập lại.',
              buttons: ['OK']
            }).then(alert => {
              alert.present();
              this.authService.logout();
              this.router.navigate(['/login']);
              return throwError(() => error); // Trả về Observable lỗi
            })
          ).pipe(
            switchMap(errObs => errObs) // Trả về Observable<never> cho đúng kiểu
          );
        }

        return throwError(() => error); // Trả lỗi nếu không phải 401
      })
    );
  }
}
