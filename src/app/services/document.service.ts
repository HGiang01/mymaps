// src/app/services/document.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // <-- Import HttpClient
import { Observable } from 'rxjs';
import { AuthService } from './auth.service'; // <-- Thêm dòng này

// (Tùy chọn) Định nghĩa kiểu dữ liệu cho tài liệu để code chặt chẽ hơn
export interface DocumentSummary {
  map_id: number;
  user_id: number;
  user_name: string;
  map_name: string;
  description: string;
  image_url: string;
  category: string;
  modified_at: string;
  shared: string;
  like: number;
  dislike: number;
}

export interface MapPoint {
  point_id: number;
  map_id: number;
  name: string;
  geom: string;
  description: string | null;
  image_url: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
// định nghĩa biến chứa url mockserver
  private ApiUrl = 'https://mymaps-app.onrender.com/template';
  
// khởi tạo httpclient và authservice
  constructor(private http: HttpClient, private authService: AuthService) { }

  // hàm lấy tài liệu ở postman
  getAllDocumentsSummary(): Observable<DocumentSummary[]> {
    const headers = this.authService.getAuthHeaders(); //thêm header token vào request để cấp quyền lấy api
    return this.http.get<DocumentSummary[]>(`${this.ApiUrl}/get_maps_template`, { headers }); 
  }

// hàm lấy chi tiết từng tại liệu postman
  //getDocumentDetails(id: string): Observable<any> {
     //const headers = this.authService.getAuthHeaders();
     //return this.http.<any>(`${this.mockApiUrl}/import/${template_map_id}`, { headers });
  //}
  //hàm tăng like cho tài liệu
  upVote(map_id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders(); // token
    return this.http.put<any>(`${this.ApiUrl}/up_vote?map_id=${map_id}`, {}, { headers });
  }

  //hàm giảm dislike cho tài liệu
  downVote(map_id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<any>(`${this.ApiUrl}/down_vote?map_id=${map_id}`, {}, { headers });
  }

  //hàm lấy thông tin user đang đăng nhập
  getCurrentUser(): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<any>('https://mymaps-app.onrender.com/users/me', { headers });
  }
 // hàm lấy điểm trên bản đồ 
  getMapPoints(map_id: number): Observable<MapPoint[]> {
    const headers = this.authService.getAuthHeaders();
    return this.http.get<MapPoint[]>(`https://mymaps-app.onrender.com/map/${map_id}`, { headers });
  }

  // Hàm đẩy map từ template qua explore
  importTemplate(map_id: number): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<any>(`https://mymaps-app.onrender.com/template/import/${map_id}`, {}, { headers });
  }
}