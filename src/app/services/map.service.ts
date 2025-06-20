import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Định nghĩa kiểu dữ liệu cho bản đồ
export interface MapItem {
  name: string;
  description?: string;
  image?: string;
  category?: string;
  modified_at: string;
  user_id: string;
}

export interface CreateMapRequest {
  name: string;
  description?: string;
  image?: File;
  category?: string;
  shared: boolean;
}

// Interface cho request tạo điểm
export interface CreatePointRequest {
  map_id: string;
  name: string;
  description?: string | null;
  image?: File | null;
  geom: string; // "kinh độ vĩ độ"
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private apiMap = 'https://mymaps-app.onrender.com/map/mymaps';
  private createMapUrl = 'https://mymaps-app.onrender.com/map/create_map';

  // Khởi tạo service
  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Lấy headers
  private getHeaders(): HttpHeaders {
    // Lấy token từ service authentication
    const token = this.authService.getAccessToken();
    // Nếu không có token thì báo lỗi
    if (!token) {
      throw new Error('Không có token');
    }
    // Trả về headers với token
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Lấy danh sách bản đồ
  getMaps(): Observable<MapItem[]> {

    return from(Promise.resolve()).pipe(
      
      switchMap(() => {
        const headers = this.getHeaders();
        
        return this.http.get<MapItem[]>(this.apiMap, { headers });
      })
    );
  }
  // Tạo bản đồ mới
  createMap(mapData: CreateMapRequest): Observable<any> {
    return from(Promise.resolve()).pipe(
      switchMap(() => {
        // Lấy headers
        const headers = this.getHeaders();
        // Tạo FormData để gửi file
        const formData = new FormData();
        formData.append('name', mapData.name);
        if (mapData.description) formData.append('description', mapData.description);
        if (mapData.category) formData.append('category', mapData.category);
        if (mapData.image) formData.append('image', mapData.image);
  
        return this.http.post(this.createMapUrl, formData, { headers });
      })
    );
  }

  // Xóa bản đồ
  deleteMap(mapId: string): Observable<any> {
    const headers = this.getHeaders();
    const url = `https://mymaps-app.onrender.com/map/delete_map?map_id=${mapId}`;
    return this.http.delete(url, { headers });
  }

  // Thêm phương thức public map
  toPublicMap(mapId: string): Observable<any> {
    const headers = this.getHeaders();
    const url = `https://mymaps-app.onrender.com/template/to_public?map_id=${mapId}`;
    return this.http.post(url, { map_id: mapId }, { headers });
  }

  // Thêm phương thức chuyển map về private
  toPrivateMap(mapId: string): Observable<any> {
    const headers = this.getHeaders();
    const url = `https://mymaps-app.onrender.com/template/to_private?map_id=${mapId}`;
    return this.http.post(url, { map_id: mapId }, { headers });
  }

  // Tạo điểm mới trên bản đồ
  createPoint(mapID:string,pointData: CreatePointRequest): Observable<any> {
    const headers = this.getHeaders();
    const formData = new FormData();
    formData.append('map_id', mapID);
    formData.append('name', pointData.name);
    if (pointData.description) formData.append('description', pointData.description);
    if (pointData.image) formData.append('image', pointData.image);
    formData.append('geom', pointData.geom);
    const url = `https://mymaps-app.onrender.com/map/create_point?map_id=${mapID}`;
    return this.http.post(url, formData, { headers });
  }

  // Xóa điểm trên bản đồ
  deletePoint(pointId: string): Observable<any> {
    const headers = this.getHeaders();
    const url = `https://mymaps-app.onrender.com/map/delete_point?point_id=${pointId}`;
    return this.http.delete(url, { headers });
  }
}
