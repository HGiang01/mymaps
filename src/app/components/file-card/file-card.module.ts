import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FileCardComponent } from './file-card.component';

@NgModule({
  declarations: [
    FileCardComponent
  ],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [
    FileCardComponent
  ]
})
export class FileCardModule { }