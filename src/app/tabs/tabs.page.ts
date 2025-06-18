import { Component } from '@angular/core';
import { TabLabels } from '../tab-labels';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    IonicModule, 
    FormsModule, 
  ],
})
export class TabsPage {
  tab1 = TabLabels.tab1;
  tab2 = TabLabels.tab2;
  tab3 = TabLabels.tab3;
  constructor() {}
}
