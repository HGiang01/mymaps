# Sửa lỗi Authentication trong tính năng Xóa Điểm

## Vấn đề gặp phải
Khi nhấn nút xóa điểm, hệ thống hiển thị lỗi "Không thể xóa điểm" và sau đó hiển thị "Token đã hết hạn bắt đăng nhập lại".

## Nguyên nhân
1. **AuthInterceptor không tự động thêm token**: AuthInterceptor ban đầu chỉ kiểm tra token hết hạn mà không tự động thêm token vào header của request.
2. **API xóa điểm yêu cầu authentication**: API `DELETE /map/delete_point` yêu cầu Bearer token trong header Authorization.
3. **Thiếu xử lý lỗi chi tiết**: Không phân biệt được các loại lỗi khác nhau (401, 403, 404, 500).

## Giải pháp đã thực hiện

### 1. Sửa AuthInterceptor (`auth.interceptor.ts`)

#### Trước khi sửa:
```typescript
intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  // Chỉ kiểm tra token hết hạn
  if (this.authService.getIsLoggedIn() && !this.authService.isTokenValid()) {
    this.authService.handleTokenExpiration();
    return throwError(() => new Error('Token đã hết hạn'));
  }
  
  return next.handle(request).pipe(...);
}
```

#### Sau khi sửa:
```typescript
intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  // Kiểm tra token hết hạn
  if (this.authService.getIsLoggedIn() && !this.authService.isTokenValid()) {
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
  
  return next.handle(request).pipe(...);
}
```

### 2. Cải thiện xử lý lỗi trong hàm deletePoint

#### Trước khi sửa:
```typescript
} catch (error) {
  console.error('Lỗi khi xóa điểm:', error);
  await loading.dismiss();
  
  const errorAlert = await this.alertController.create({
    header: 'Lỗi',
    message: 'Không thể xóa điểm. Vui lòng thử lại sau.',
    buttons: ['OK']
  });
  await errorAlert.present();
}
```

#### Sau khi sửa:
```typescript
} catch (error: any) {
  console.error('Lỗi khi xóa điểm:', error);
  await loading.dismiss();
  
  // Kiểm tra loại lỗi để hiển thị thông báo phù hợp
  let errorMessage = 'Không thể xóa điểm. Vui lòng thử lại sau.';
  
  if (error.status === 401 || error.status === 403) {
    errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  } else if (error.status === 404) {
    errorMessage = 'Không tìm thấy điểm cần xóa.';
  } else if (error.status === 500) {
    errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
  }
  
  const errorAlert = await this.alertController.create({
    header: 'Lỗi',
    message: errorMessage,
    buttons: ['OK']
  });
  await errorAlert.present();
}
```

## Cách hoạt động mới

### 1. Luồng xử lý request
1. **Request được tạo**: Khi gọi `http.delete()`
2. **AuthInterceptor can thiệp**: Tự động thêm token vào header
3. **Request được gửi**: Với header `Authorization: Bearer {token}`
4. **Response được xử lý**: Thành công hoặc lỗi

### 2. Xử lý lỗi chi tiết
- **401/403**: Token không hợp lệ hoặc hết hạn
- **404**: Không tìm thấy điểm cần xóa
- **500**: Lỗi server
- **Khác**: Lỗi chung

### 3. Tự động xử lý token hết hạn
- AuthInterceptor tự động phát hiện token hết hạn
- Gọi `authService.handleTokenExpiration()`
- Hiển thị modal "Token đã hết hạn"

## Lợi ích của việc sửa lỗi

### 1. Tự động authentication
- Tất cả HTTP request sẽ tự động có token
- Không cần thêm token thủ công cho từng request
- Đảm bảo tính nhất quán

### 2. Xử lý lỗi tốt hơn
- Thông báo lỗi rõ ràng và cụ thể
- Người dùng hiểu được nguyên nhân lỗi
- Dễ dàng debug và xử lý

### 3. Trải nghiệm người dùng tốt hơn
- Không bị gián đoạn bởi lỗi authentication
- Thông báo lỗi thân thiện
- Hướng dẫn rõ ràng khi gặp lỗi

## Kiểm tra và test

### 1. Test case thành công
- Đăng nhập với token hợp lệ
- Chọn map thuộc sở hữu
- Click xóa điểm
- Xác nhận xóa
- Điểm được xóa thành công

### 2. Test case lỗi authentication
- Token hết hạn
- Click xóa điểm
- Hiển thị thông báo "Phiên đăng nhập đã hết hạn"
- Tự động chuyển về trang đăng nhập

### 3. Test case lỗi khác
- Điểm không tồn tại (404)
- Lỗi server (500)
- Lỗi mạng

## Lưu ý quan trọng

1. **AuthInterceptor hoạt động toàn cục**: Tất cả HTTP request sẽ được xử lý
2. **Token được lưu trong localStorage**: Đảm bảo persistence
3. **Tự động logout khi token hết hạn**: Bảo mật
4. **Xử lý lỗi graceful**: Không crash ứng dụng

## Kết quả
- ✅ Tính năng xóa điểm hoạt động bình thường
- ✅ Authentication được xử lý tự động
- ✅ Thông báo lỗi rõ ràng và hữu ích
- ✅ Trải nghiệm người dùng được cải thiện 