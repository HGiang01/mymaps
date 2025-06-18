import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, NavController, IonicModule, MenuController } from '@ionic/angular';
import { DocumentService, DocumentSummary } from '../services/document.service';
import { MapService, MapItem, CreateMapRequest } from '../services/map.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  files: DocumentSummary[] = [];
  filteredFiles: DocumentSummary[] = [];
  searchQuery: string = '';
  showSuggestions: boolean = false;

  segmentValue: string = 'all';
  maps: MapItem[] = [];           // Danh sách bản đồ gốc
  filteredMaps: MapItem[] = [];   // Danh sách bản đồ đã lọc

  isModalOpen = false;    // Biến để kiểm soát trạng thái của modal
  createMapForm: FormGroup; // Form để tạo bản đồ mới
  selectedFile: File | null = null; // File được chọn

  // Khởi tạo service
  constructor(
    private navCtrl: NavController,
    private documentService: DocumentService,
    private menu: MenuController,
    
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private mapService: MapService,
    private loadingController: LoadingController,
    private authService: AuthService
  ) {
    // Khởi tạo form
    this.createMapForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: [''],
      shared: [false]
    });
  }

  // ngOnInit chỉ chạy 1 lần duy nhất khi component được khởi tạo
  ngOnInit() {
    // Tải danh sách bản đồ
    this.loadMaps();
    this.filterMaps();
    this.segmentChanged(this.segmentValue);
    this.openMenu();
    this.onSearchChange(this.searchQuery);
    this.clearSearch();
  }

  loadMaps() {
    const userId = this.authService.getUserId();
    console.log('UserId:', userId); // Log userId

    this.mapService.getMaps().subscribe({
      // Khi có dữ liệu
      next: (data) => {
        this.maps = data;
        console.log('Dữ liệu maps:', this.maps); // <-- Thêm dòng này để kiểm tra
        this.filterMaps(); // Lọc maps dựa trên segment hiện tại
      },
      error: (error) => {
        console.error('Error loading maps:', error);
        this.showAlert('Lỗi', 'Không thể tải danh sách bản đồ');
      }
    });
  }

  filterMaps() {
    switch (this.segmentValue) {
      case 'created':
        this.filteredMaps = this.maps.filter(map => map.user_id === this.authService.getUserId());
        break;
      case 'shared':
        this.filteredMaps = this.maps.filter(map => map.user_id !== this.authService.getUserId());
        break;
      default:
        this.filteredMaps = [...this.maps];
    }
  }

  openCreateMapModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.createMapForm.reset();
    this.selectedFile = null;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async onSubmit() {
    if (this.createMapForm.invalid) {
      await this.showAlert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Đang tạo bản đồ...'
    });
    await loading.present();

    const mapData: CreateMapRequest = {
      ...this.createMapForm.value,
      image: this.selectedFile
    };

    this.mapService.createMap(mapData).subscribe({
      next: async (response) => {
        await loading.dismiss();
        await this.showAlert('Thành công', 'Tạo bản đồ mới thành công!');
        this.closeModal();
        this.loadMaps(); // Tải lại danh sách bản đồ
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Error creating map:', error);
        await this.showAlert('Lỗi', 'Không thể tạo bản đồ. Vui lòng thử lại sau.');
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  segmentChanged(event: any) {
    this.segmentValue = event.detail.value;
    this.filterMaps();
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value.toLowerCase();
    this.showSuggestions = this.searchQuery.length > 0; // khi nhập từ khóa showSuggestions = true -> hiển thị danh sách gợi ý
    // lọc kết quả tìm kiếm bằng tên của tài liệu hoặc tên chủ sở hữu tài liệu
    this.filteredFiles = this.files.filter(file =>
      file.map_name.toLowerCase().includes(this.searchQuery) ||
      file.user_name.toLowerCase().includes(this.searchQuery)
    );
  }

// hàm chọn vào mục trong danh sách gợi ý
// khi chọn, truyền vào file cấu trúc của tài liệu đã chọn
// ẩn danh sách gợi ý(false) hiển thị tên tài liệu được chọn trong thanh tìm kiếm
//  cô lập và hiển thị duy nhất(file) tài liệu được chọn vào phần content
  selectSuggestion(file: DocumentSummary) {
    this.searchQuery = file.map_name;
    this.showSuggestions = false;
    this.filteredFiles = [file];
  }
// xóa thành tìm kiếm và trả phần content về ban đầu
  clearSearch() {
    this.searchQuery = '';
    this.showSuggestions = false;
    this.filteredFiles = this.files;
  }
  
  openMenu() {
    this.menu.enable(true, 'main-menu');
    this.menu.open('main-menu');
  }
}
