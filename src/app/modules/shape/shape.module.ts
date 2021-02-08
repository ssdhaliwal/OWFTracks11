import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { AgGridModule } from 'ag-grid-angular';
import { ColorPickerModule } from 'ngx-color-picker';
import { SharedServicesModule } from '../shared-services.module';

import { ShapeCoreComponent } from './shape-core/shape-core.component';
import { ShapeGridComponent } from './shape-grid/shape-grid.component';

const appRoutes: Routes = [
  {
    path: 'service', component: ShapeCoreComponent, outlet: 'trackOutlet',
    children: [
      {
        path: 'connect.shape/:id',
        component: ShapeCoreComponent
      }
    ]
  }
];

@NgModule({
  declarations: [ShapeCoreComponent, ShapeGridComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(appRoutes),
    NoopAnimationsModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatGridListModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    AgGridModule.withComponents([]),
    ColorPickerModule,
    SharedServicesModule.forRoot()
  ],
  exports: [ShapeCoreComponent, ShapeGridComponent]
})
export class ShapeModule { }
