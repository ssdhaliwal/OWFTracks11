import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';

import { AgGridModule } from 'ag-grid-angular';
import { SharedServicesModule } from '../shared-services.module';

import { CsvCoreComponent } from './csv-core/csv-core.component';
import { CsvGridComponent } from './csv-grid/csv-grid.component';

const appRoutes: Routes = [
  {
    path: 'service', component: CsvCoreComponent, outlet: 'trackOutlet',
    children: [
      {
        path: 'connect.csv',
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
    FormsModule,
    MatFormFieldModule,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    AgGridModule.withComponents([]),
    SharedServicesModule.forRoot()
  ],
  exports: [CsvCoreComponent, CsvGridComponent]
})
export class CsvModule { }
