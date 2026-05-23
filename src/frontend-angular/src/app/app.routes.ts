import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { InvoiceListComponent } from './pages/invoices/invoice-list/invoice-list.component';
import { InvoiceFormComponent } from './pages/invoices/invoice-form/invoice-form.component';
import { CustomerListComponent } from './pages/customers/customer-list/customer-list.component';
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
    path: 'invoices/new',
    component: InvoiceFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'invoices/edit/:id',
    component: InvoiceFormComponent,
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    component: CustomerListComponent,
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