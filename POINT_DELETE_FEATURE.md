# Tính năng Xóa Điểm trong Tab Explore

## Tổng quan
Đã thêm tính năng xóa điểm vào tab explore với đầy đủ các yêu cầu:
- Nút xóa điểm trong popup thông tin điểm
- Kiểm tra quyền xóa (chỉ chủ sở hữu map mới có quyền)
- Thông báo xác nhận trước khi xóa
- Loading spinner trong quá trình xóa
- Gọi API xóa điểm
- Thông báo kết quả thành công/thất bại

## Các thay đổi đã thực hiện

### 1. Import và Dependencies
- Thêm `AlertController` và `LoadingController` từ `@ionic/angular`
- Thêm `HttpClient` từ `@angular/common/http`

### 2. Biến mới
- `loadingDelete`: Theo dõi trạng thái xóa điểm

### 3. Hàm mới được thêm

#### `canDeletePoint(point: any): boolean`
- **Mục đích**: Kiểm tra quyền xóa điểm
- **Logic**: So sánh ID người dùng hiện tại với ID chủ sở hữu map
- **Trả về**: `true` nếu có quyền xóa, `false` nếu không

#### `handleNavigateClick(latlng: { lat: number; lon: number }): void`
- **Mục đích**: Xử lý sự kiện click nút dẫn đường
- **Chức năng**: 
  - Xóa route cũ nếu có
  - Lấy vị trí hiện tại của người dùng
  - Vẽ đường đi từ vị trí hiện tại đến điểm đích

#### `handleDeletePointClick(pointId: string, point: any): Promise<void>`
- **Mục đích**: Xử lý sự kiện click nút xóa điểm
- **Chức năng**:
  - Hiển thị dialog xác nhận xóa
  - Gọi hàm `deletePoint()` nếu người dùng xác nhận

#### `deletePoint(pointId: string, point: any): Promise<void>`
- **Mục đích**: Thực hiện xóa điểm
- **Chức năng**:
  - Hiển thị loading spinner
  - Gọi API xóa điểm: `DELETE https://mymaps-app.onrender.com/map/delete_point?point_id=${pointId}`
  - Hiển thị thông báo thành công/thất bại
  - Reload lại danh sách điểm trên bản đồ

### 4. Hàm được cập nhật

#### `createPointPopupContent(point: any): string`
- **Thay đổi**: Thêm nút xóa điểm vào popup
- **Logic**: 
  - Kiểm tra quyền xóa bằng `canDeletePoint()`
  - Chỉ hiển thị nút xóa nếu có quyền
  - Thêm nút dẫn đường và nút xóa vào cuối popup

#### `createPointMarker(point: any, latlng: { lat: number; lon: number }): L.Marker`
- **Thay đổi**: Thêm event listener cho popup
- **Logic**:
  - Lắng nghe sự kiện `popupopen`
  - Thêm event listener cho nút dẫn đường và nút xóa
  - Sử dụng `setTimeout` để đảm bảo DOM đã được tạo

#### `addPointsToMap(points: any[])`
- **Thay đổi**: Thêm thông tin `latlng` vào point object
- **Mục đích**: Để sử dụng trong popup content

## Luồng hoạt động

### 1. Hiển thị Popup
1. Người dùng click vào điểm trên bản đồ
2. Popup hiển thị với thông tin điểm
3. Nếu có quyền xóa, nút "Xóa điểm" sẽ hiển thị

### 2. Xử lý Xóa Điểm
1. Người dùng click nút "Xóa điểm"
2. Hiển thị dialog xác nhận với tên điểm
3. Nếu xác nhận:
   - Hiển thị loading spinner
   - Gọi API xóa điểm
   - Hiển thị thông báo kết quả
   - Reload lại danh sách điểm

### 3. Kiểm tra Quyền
- Chỉ chủ sở hữu map mới có quyền xóa điểm
- So sánh `currentUserId` với `selectedMapOwnerId`
- Nút xóa chỉ hiển thị khi có quyền

## API Endpoint
```
DELETE https://mymaps-app.onrender.com/map/delete_point?point_id={point_id}
```

## Giao diện người dùng

### Popup thông tin điểm
- Tên điểm (cắt ngắn nếu quá dài)
- Mô tả điểm (cắt ngắn nếu quá dài)
- Hình ảnh điểm (nếu có)
- Nút "Dẫn đường tới đây" (màu xanh)
- Nút "Xóa điểm" (màu đỏ, chỉ hiển thị khi có quyền)

### Dialog xác nhận
- Header: "Xác nhận xóa điểm"
- Message: "Bạn có chắc chắn muốn xóa điểm [tên điểm] không? Hành động này không thể hoàn tác."
- Nút "Hủy" (màu xám)
- Nút "Xóa" (màu đỏ)

### Loading Spinner
- Message: "Đang xóa điểm..."
- Spinner: "crescent"

### Thông báo kết quả
- **Thành công**: "Đã xóa điểm [tên điểm] thành công!"
- **Thất bại**: "Không thể xóa điểm. Vui lòng thử lại sau."

## Debug Information
Các thông tin debug được in ra console:
- Thông tin user ID và map owner ID
- Kiểm tra quyền xóa điểm
- Kết quả API call

## Lưu ý
- Tính năng chỉ hoạt động khi đã chọn map
- Chỉ chủ sở hữu map mới có quyền xóa điểm
- Điểm sẽ bị xóa vĩnh viễn và không thể hoàn tác
- Sau khi xóa thành công, danh sách điểm sẽ được reload tự động 