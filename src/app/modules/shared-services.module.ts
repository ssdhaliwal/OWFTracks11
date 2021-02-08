import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FileUploadButtonComponent } from '../components/file-upload-button/file-upload-button.component';

import { ActionNotificationService } from '../service/action-notification.service';
import { ConfigService } from '../service/config.service';

@NgModule({
  declarations: [FileUploadButtonComponent],
  imports: [CommonModule],
  exports: [FileUploadButtonComponent]
})
export class SharedServicesModule {
    static forRoot(): ModuleWithProviders<SharedServicesModule> {
      return {
        ngModule: SharedServicesModule,
        providers: [ActionNotificationService, ConfigService]
      };
    }
}