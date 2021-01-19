import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ActionNotificationService } from '../service/action-notification.service';
import { ConfigService } from '../service/config.service';

@NgModule({
  imports: [CommonModule]
})
export class SharedServicesModule {
    static forRoot(): ModuleWithProviders<SharedServicesModule> {
      return {
        ngModule: SharedServicesModule,
        providers: [ActionNotificationService, ConfigService]
      };
    }
}