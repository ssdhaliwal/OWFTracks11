import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GrowlerComponent } from './components/growler/growler.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';

const routes: Routes = [
  { path: 'service', loadChildren: './modules/cot/cot.module#CotModule' },
  { path: 'service', loadChildren: './modules/shape/shape.module#ShapeModule' },
  { path: 'service', loadChildren: './modules/csv/csv.module#CsvModule' },
  { path: 'service', loadChildren: './modules/features/features.module#FeaturesModule' },
  { path: 'service', loadChildren: './modules/aisvts/aisvts.module#AisVtsModule' },
  { path: 'service', loadChildren: './modules/sensors/sensors.module#SensorsModule' },
  { path: 'service', loadChildren: './modules/search/search.module#SearchModule' },
  { path: '', redirectTo: '/', pathMatch: 'full' },
  { path: 'message/:severity', component: GrowlerComponent },
  { path: '**', component: PageNotFoundComponent, outlet: 'trackOutlet' },
  { path: '**', component: PageNotFoundComponent, outlet: 'errorOutlet' },
  { path: '**', redirectTo: 'message' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes,
    { useHash: true /*, enableTracing: true */ })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
