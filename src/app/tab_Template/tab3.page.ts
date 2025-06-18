import { Component, OnInit } from '@angular/core';
import { NavController, IonicModule, MenuController } from '@ionic/angular';
import { DocumentService, DocumentSummary } from '../services/document.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
// chuẩn bị cấu trúc dữ liệu
export class Tab3Page {
  files: DocumentSummary[] = [];
  filteredFiles: DocumentSummary[] = [];
  searchQuery: string = '';
  showSuggestions: boolean = false;
  
  constructor(
    private navCtrl: NavController,
    private documentService: DocumentService,
    private menu: MenuController
  ) {}

  ngOnInit() {
    // lấy dữ liệu từ API
    this.documentService.getAllDocumentsSummary().subscribe({
      next: (data) => {
        // Lọc chỉ lấy các phần tử có shared = 1
        this.files = data.filter(file => String(file.shared) === '1'); // lọc các tài liệu có shared = 1
        this.filteredFiles = this.files;
        console.log('Dữ liệu từ API:', this.files);
      },
      error: (error) => {
        console.error('Lỗi khi lấy dữ liệu từ Mock API:', error);
      }
    });
  }
//hàm cập nhật kết quả tìm kiếm khi nhập từ khóa
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
