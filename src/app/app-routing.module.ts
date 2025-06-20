import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { BaseLayoutComponent } from './components/base-layout/base-layout.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'intro',
    pathMatch: 'full'
  },
  // Các route không dùng MenuBar (intro, login, register)
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'intro',
    loadChildren: () => import('./pages/intro/intro.module').then( m => m.IntroPageModule)
  },
  // Các route dùng MenuBar
  {
    path: '',
    component: BaseLayoutComponent,
    children: [
      {
        path: 'tabs',
        loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./pages/settings/settings.module').then( m => m.SettingsPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('./pages/profile/profile.module').then( m => m.ProfilePageModule)
      },
      {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact.page').then(m => m.ContactPage)
      },
      {
        path: 'feedback',
        loadChildren: () => import('./pages/feedback/feedback.module').then( m => m.FeedbackPageModule)
      },
    ]
  },
  {
    path: 'about-us',
    loadComponent: () => import('./components/about-us/about-us.component').then(m => m.AboutUsComponent)
  },

];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
