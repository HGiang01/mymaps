import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController, NavController, IonicModule, MenuController } from '@ionic/angular';
import { DocumentService, DocumentSummary } from '../services/document.service';
import { MapService, MapItem, CreateMapRequest } from '../services/map.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {
  searchQuery: string = '';

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
    private authService: AuthService,
    private router: Router
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
    this.loadMaps();
    }

  loadMaps() {
    const userId = this.authService.getUserId();
    if (!userId) {
      // Có thể thử lại sau 100ms hoặc show thông báo
      setTimeout(() => this.loadMaps(), 100);
      return;
    }
    this.mapService.getMaps().subscribe({
      next: (data) => {
        this.maps = data;
        this.filterMaps();
      },
      error: (error) => {
        this.showAlert('Lỗi', 'Không thể tải danh sách bản đồ');
      }
    });
  }

  filterMaps() {
    switch (this.segmentValue) {
      case 'created':
        this.filteredMaps = this.maps.filter(map => !map.name.startsWith('Copy of '));
        break;
      case 'shared':
        this.filteredMaps = this.maps.filter(map => map.name.startsWith('Copy of '));
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
    const query = event.detail.value?.toLowerCase() || '';
    if (query.length > 0) {
      this.filteredMaps = this.maps.filter(map =>
        map.name && map.name.toLowerCase().includes(query)
      );
    } else {
      this.filteredMaps = [...this.maps];
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredMaps = [...this.maps];
  }
  
  openMenu() {
    this.menu.enable(true, 'main-menu');
    this.menu.open('main-menu');
  }
}
