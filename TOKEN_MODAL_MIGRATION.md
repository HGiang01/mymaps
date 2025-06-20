# Chuyển đổi TokenExpiredModalComponent từ App Component sang Tabs Page

## Tổng quan
Đã chuyển đổi component `TokenExpiredModalComponent` từ việc sử dụng toàn cục trong `AppComponent` sang chỉ sử dụng trong `TabsPage`.

## Các thay đổi đã thực hiện

### 1. Cập nhật `tabs.page.ts`
- Thêm import `TokenExpiredModalComponent`
- Thêm `TokenExpiredModalComponent` vào array `imports`

### 2. Cập nhật `tabs.page.html`
- Thêm `<app-token-expired-modal></app-token-expired-modal>` vào cuối file

### 3. Cập nhật `app.component.html`
- Xóa `<app-token-expired-modal></app-token-expired-modal>`

### 4. Cập nhật `app.module.ts`
- Xóa import `TokenExpiredModalComponent`
- Xóa `TokenExpiredModalComponent` khỏi array `imports`

### 5. Cập nhật `app.component.ts`
- Xóa import `TokenExpiredModalComponent`

## Lợi ích của việc chuyển đổi

1. **Phạm vi sử dụng cụ thể**: Modal chỉ hiển thị khi user đang ở trong tabs (các trang chính của app)
2. **Tối ưu hiệu suất**: Không load component không cần thiết ở các trang khác
3. **Quản lý state tốt hơn**: Modal chỉ hoạt động trong context của tabs
4. **Cấu trúc code rõ ràng**: Logic liên quan đến token được tập trung ở nơi cần thiết

## Kiểm tra
- Build thành công không có lỗi
- Component vẫn hoạt động bình thường trong tabs
- Không ảnh hưởng đến các trang khác

## Lưu ý
- TokenExpiredModalComponent vẫn là standalone component
- Không cần thay đổi logic bên trong component
- AuthService và TokenCheckerService vẫn hoạt động bình thường 