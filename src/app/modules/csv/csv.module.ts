import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AgGridModule } from 'ag-grid-angular';
import { ColorPickerModule } from 'ngx-color-picker';
import { SharedServicesModule } from '../shared-services.module';

import { CsvCoreComponent } from './csv-core/csv-core.component';
import { CsvGridComponent } from './csv-grid/csv-grid.component';

const appRoutes: Routes = [
  {
    path: 'service', component: CsvCoreComponent, outlet: 'trackOutlet',
    children: [
      {
        path: 'connect.csv/:id',
        component: CsvCoreComponent
      }
    ]
  }
];

@NgModule({
  declarations: [CsvCoreComponent, CsvGridComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(appRoutes),
    NoopAnimationsModule,
    FormsModule,
    MatFormFieldModule,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    AgGridModule.withComponents([]),
    ColorPickerModule,
    SharedServicesModule.forRoot()
  ],
  exports: [CsvCoreComponent, CsvGridComponent]
})
export class CsvModule { }
