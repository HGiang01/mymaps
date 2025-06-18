import { Component, OnInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import 'ionicons';
import { MenuController } from '@ionic/angular';
import { MapShareService } from '../services/map-share.service';
import { DocumentService } from '../services/document.service';
import { Subscription } from 'rxjs';
import { TabLabels } from '../tab-labels';

interface SearchResult {
  display_name: string;
  lat: number;
  lon: number;
}
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
  })
  
export class Tab1Page implements OnInit, OnDestroy {
  tab1 = TabLabels.tab1;

  private map!: L.Map; //khai báo biến map, !: đảm bảo kết quả không phải null hoặc undefined
  private currentLocationMarker: L.Marker | null = null; //biến điểm đánh dấu, giá trị ban đầu = null, kết quả có thể là 1 điểm hoặc null
  private locationControl!: L.Control; // gán cho biến một lớp công cụ điều khiển của leaflet
  private searchMarker: L.Marker | null = null;
  private CORS_PROXY = 'https://corsproxy.io/?'; // dòng này để tránh lỗi CORS thông qua proxy
  private currentTileLayer!: L.TileLayer; // tạo biến currentTileLayer, kiểu L.TileLayer, dảm bảo không phải null hoặc undefined
  private isTerrainMode: boolean = false;
  searchQuery: string = '';
  searchResults: any[] = [];
  selectedMapId: number | null = null; // id của map đã chọn từ template
  private pointMarkers: L.Marker[] = []; //mảng chứa tất cả marker đang hiển thị
  private mapIdSub?: Subscription;

  //khởi tạo menu
  constructor(
    private menuCtrl: MenuController,
    private mapShareService: MapShareService,
    private documentService: DocumentService
  ) {}
  ngOnInit() {
    this.initMap();//khởi tạo bản đồ khi mới mở app
    this.mapIdSub = this.mapShareService.currentMapId$.subscribe(id => { // lấy map_id từ service và gán vào biến id
      if (id) {
        this.documentService.getMapPoints(id).subscribe(points => { //gọi api lấy tất cả point trong map đã chọn
          this.clearPointMarkers(); //má marker cũ trước khi vẽ cái mới
          let minPoint: any = null; //biến lưu point có id nhỏ nhất
          points.forEach(point => { // lặp qua từng point
            const latlng = wkbHexToLatLng(point.geom); //lạo biến chứa lat và lon
            if (latlng) {
              const marker = L.marker([latlng.lat, latlng.lon], {
                icon: L.icon({
                  iconUrl: '../assets/icon/location-icon.png',
                  iconSize: [25, 40]
                })
              }).addTo(this.map)// gắn marker vào map
                .bindPopup(`
                  <div style="display: flex; align-items: flex-start; width: 280px; padding: 8px;">
                    <div style="flex: 2; padding: 4px; max-width: 150px;">
                      <div style="font-size: 1em; font-weight: bold; margin-bottom: 0.25em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${point.name.length > 10 ? point.name.substring(0, 25) + '...' : point.name}
                      </div>
                      <div style="font-size: 0.8em; color: #222; word-wrap: break-word; max-height: 80px; overflow-y: auto;">
                        ${point.description ? (point.description.length > 150 ? point.description.substring(0, 150) + '...' : point.description) : ''}
                      </div>
                    </div>
                    <div style="flex: 1; min-width: 100px; max-width: 120px; height: 100px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                      ${point.image_url ? `
                        <img src="${point.image_url}" 
                             style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; border: 1px solid #222;"
                             onerror="this.onerror=null; this.src='../assets/default-image.png';"
                             loading="lazy" />` 
                        : ''}
                    </div>
                  </div>
                `); //tạo popup hiển thị nội dung của point
              this.pointMarkers.push(marker); // gắn tất cả marker vào mảng pointMarkers
              // sửa biến minpoint nếu điểm tiếp theo trong thứ tự lặp nhỏ hơn
              if (!minPoint || point.point_id < minPoint.point_id) {
                minPoint = { ...point, ...latlng };
              }
            }
          });
          // Điều hướng tới point có id nhỏ nhất
          if (minPoint) {
            this.map.setView([minPoint.lat, minPoint.lon], 18);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.mapIdSub?.unsubscribe(); // hủy subscription của mapidsub khi chuyển tab hoặc tắt ứng dụng
    this.clearPointMarkers(); // xóa tất cả marker trên map
  }

  ionViewWillEnter() {
    this.mapShareService.currentMapId$.subscribe(id => { // khi map_id được chọn thay đổi, gán cái mới vào id
      this.selectedMapId = id;
      console.log('Selected map_id:', id);
      if (id) {
        this.documentService.getMapPoints(id).subscribe(data => {
          console.log('Dữ liệu trả về từ getMapPoints:', data);
        });
      }
    });
  }

//hàm mở menu
  async openMenu() {
    await this.menuCtrl.open();
  }

  // hàm xử lý tìm kiếm
  async onSearchChange(event: any) { // Định dạng hàm không đồng bộ async để việc sử dụng await không ảnh hưởng tới chương trình
    const query = event.detail.value; // gắn giá trị input vào biến query khi người dùng nhập từ khóa
    if (query && query.length > 3) {
      try {
        // Sử dụng trực tiếp proxy đáng tin cậy
        const response = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent( // dòng này để tránh lỗi CORS
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5` // api nominatim, lấy kết quả tương ứng với từ khóa (query) dưới dạng json gán vào biến response với số lượng < 5
          )}`
        );

        if (!response.ok) { // kiểm tra xem có nhận dc api không
          throw new Error(`Lỗi kết nối: ${response.status}`);
        }

        const results = await response.json();
        
        if (!Array.isArray(results)) { // kiểm tra xem có phải mảng không
          throw new Error('Dữ liệu không hợp lệ');
        }

        this.searchResults = results.map((item: any) => ({ // chia kết quả dc phản hồi  vào các biến, trong đó lat lon chuyển về dạng float
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        }));
      } catch (error) {
        console.error('Lỗi tìm kiếm:', error);
        this.searchResults = [];
      }
    } else {
      this.searchResults = [];
    }
  }
//gắn điểm tìm kiếm vào bản đồ
  selectLocation(location: any) {
    if (this.searchMarker) { // có rồi thì xóa
      this.map.removeLayer(this.searchMarker);
    }

    this.searchMarker = L.marker([location.lat, location.lon], { // chưa có thì tạo cái mới với lat lon mới lấy được ở trên
      icon: L.icon({
        iconUrl: '../assets/icon/result-point-icon.png',
        iconSize: [25, 40]
      })
    }).addTo(this.map);

    // căn giữa điểm địa lý trên bản đồ theo kích thước của màn hình
    const headerHeight = document.querySelector('ion-header')?.clientHeight || 0; // tìm phần tử header, nếu không có thì trả về 0
    const point = this.map.project([location.lat, location.lon], 16);
    point.y -= headerHeight / 2; // Điều chỉnh vị trí y để tính đến chiều cao của header
    const adjustedLatLng = this.map.unproject(point, 16);
    
    // Di chuyển map đến vị trí đã điều chỉnh
    this.map.setView(adjustedLatLng, 16, {});
    
    this.searchResults = [];
  }

  //xóa kết quả tìm kiếm, xóa marker tìm kiếm
  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    if (this.searchMarker) {
      this.map.removeLayer(this.searchMarker);
      this.searchMarker = null;
    }
  }

  private initMap(): void {
    // nếu có map r thì không tạo lại
    if (this.map) return;

    // nếu chưa có thì tạo, gắn vào phần tử có id = "map"
    this.map = L.map('map').setView([10.870126934968653, 106.79020962591983], 20);

    // Khởi tạo layer bản đồ, mặc định là bản đồ openstreetmap, khi thay đổi dạng bản đồ chỉ cần thay đổi biến currentTileLayer
    this.currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(this.map);

    this.addLocationControl();
    this.addTerrainControl();
  }
 //  hàm tạo nút định vị không trả về giá trị (void)
  private addLocationControl(): void {
    // Tạo nút định vị từ lớp L.control đặt ở vị trí topright
    const locationButton = L.Control.extend({
      options: {
        position: 'topright'
      },
//định dạng nút định vị, và gắn chức năng từ hàm getCurrentLocation()
      onAdd: (map: L.Map) => { // phương thức onAdd nhận tham số map: L.Map, định dạng nút định vị
        const btn = L.DomUtil.create('button', 'location-button'); //tiện ích DomUtil.create tạo 1 button thêm vào DOM không cần thông qua html, cho phép chỉnh css ngay lập tức
        btn.innerHTML = '<img src="../assets/icon/marker-icon.png" alt="Location Icon" class="location-icon">'; //đặt vào phần tử một nội dung từ html bằng hàm innerHTML mà cụ thể là cái iconnn
        btn.style.width = '35px';
        btn.style.height = '35px';
        btn.style.backgroundColor = 'white';
        btn.style.border = '5px solid rgba(255, 255, 255, 0.2)';
        btn.style.borderRadius = '4px';
// chạy hàm getCurrentLocation() khi click vào
        btn.addEventListener('click', () => {
          this.getCurrentLocation();
        });

        return btn;
      }
    });

    // tạo ra đối tượng mới từ lớp locationbutton mới được định nghĩa và gán vào biến locationControl, nhằm chỉnh sửa và thay đổi thông qua locationControl
    this.locationControl = new locationButton().addTo(this.map);
  }
  //hàm lấy vị trí hiện tại của người dùng
  private getCurrentLocation(): void {// tạo hàm getCurrentLocation() không trả về giá trị (void)
    if ('geolocation' in navigator) { // kiểm tra sự tồn tại của API geolocation trong navigator, API này có sẵn trong trình duyệt cung cấp tọa độ khi ng dùng cho cmn phép
      navigator.geolocation.getCurrentPosition( // gọi hàm getCurrentPosition() của API có sẵn và trả về positon, sau đó gán kinh độ và vĩ độ từ position.coords vào biến latitude và longitude
        (position) => {
          const { latitude, longitude } = position.coords;
          
          this.map.setView([latitude, longitude], 18);

          // Xóa marker cũ (nếu có)
          if (this.currentLocationMarker) {
            this.map.removeLayer(this.currentLocationMarker);
          }

          // Tạo marker mới bằng hàm L.marker
          this.currentLocationMarker = L.marker([latitude, longitude], {
            icon: L.icon({
              iconUrl: '../assets/icon/current-location.png',
              iconSize: [25, 40]
            })
          }).addTo(this.map);
        },
        (error) => {
          console.error('Lỗi khi lấy vị trí:', error);
        }
      );
    } else {
      console.error('Trình duyệt không hỗ trợ định vị');
    }
  }
  //tạo nút bản đồ độ cao, định dạng L.Control, vị trí dưới cùng bên phải
  private addTerrainControl(): void {
    const terrainButton = L.Control.extend({
      options: {
        position: 'bottomright'
      },


      onAdd: (map: L.Map) => {
        const btn = L.DomUtil.create('button', 'terrain-button');
        btn.innerHTML = '<img src="../assets/icon/terrain-map-icon.png" alt="terrain Icon" class="terrain-icon">';
        btn.style.width = '35px';
        btn.style.height = '35px';
        btn.style.backgroundColor = 'white';
        btn.style.border = '5px solid rgba(255, 255, 255, 0.2)';
        btn.style.borderRadius = '4px';
        btn.title = 'Chuyển đổi bản đồ địa hình';

        btn.addEventListener('click', () => {
          this.toggleTerrainMap(); // chạy hàm toggleTerrainMap() khi click vào
        });

        return btn;
      }
    });
    
    // gắn nút vào map
    new terrainButton().addTo(this.map);
  }
  // hàm chuyển đổi bản đồ độ cao
  private toggleTerrainMap(): void {
    if (this.currentTileLayer) { // xóa lớp bản đồ bất kỳ hiện tại
      this.map.removeLayer(this.currentTileLayer);
    }

    if (!this.isTerrainMode) {
      // Chuyển sang bản đồ địa hình
      this.currentTileLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap contributors'
      }).addTo(this.map);
    } else {
      // Chuyển về bản đồ thường
      this.currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
    }

    this.isTerrainMode = !this.isTerrainMode; // đảo ngược giá trị của biến isTerrainMode
  }
  // hàm xóa mảng pointMarkers chứa tất cả điểm trên map
  private clearPointMarkers() {
    this.pointMarkers.forEach(marker => this.map.removeLayer(marker));
    this.pointMarkers = [];
  }
}

// Hàm chuyển đổi WKB hex POINT sang lat/lon
function wkbHexToLatLng(wkb: string): { lat: number, lon: number } | null {
  if (!wkb || wkb.length !== 50) return null;
  const lonHex = wkb.slice(18, 34);
  const latHex = wkb.slice(34, 50);
  const lon = hexToDoubleLE(lonHex);
  const lat = hexToDoubleLE(latHex);
  return { lat, lon };
}
// hàm chuyển đổi hex thành double
function hexToDoubleLE(hex: string): number {
  const buffer = new ArrayBuffer(8);
  const dataView = new DataView(buffer);
  for (let i = 0; i < 8; i++) {
    dataView.setUint8(i, parseInt(hex.substr(i * 2, 2), 16));
  }
  return dataView.getFloat64(0, true);
}




