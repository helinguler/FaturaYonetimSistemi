import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { InvoiceListComponent } from './pages/invoices/invoice-list/invoice-list.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'invoices',
    component: InvoiceListComponent,
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];