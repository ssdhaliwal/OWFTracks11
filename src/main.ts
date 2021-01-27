import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import { OwfApi } from './app/library/owf-api';

declare var OWF: any;
declare var Ozone: any;

if (environment.production) {
  enableProdMode();
}

OWF.ready(function() {
  let owfapi = new OwfApi();
  owfapi.initialize(owfapi.shutdownWidget);

  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
});
