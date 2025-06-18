import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tab3Page } from './tab3.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { FileCardModule } from '../components/file-card/file-card.module';

import { Tab3PageRoutingModule } from './tab3-routing.module';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    Tab3PageRoutingModule,
    HttpClientModule,
    FileCardModule
  ],
  declarations: [Tab3Page]
})
export class Tab3PageModule {}
