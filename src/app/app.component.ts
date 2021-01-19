import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ConfigService } from './service/config.service';
import { ActionNotificationService } from './service/action-notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'OWFTracks11';
  ready: boolean = false;
	firstTime: boolean = true;

	subscription: Subscription;

	constructor(private _zone: NgZone,
		private router: Router,
		private notificationService: ActionNotificationService,
		private configService: ConfigService) {
		this.subscription = this.notificationService.publisher$.subscribe(
			payload => {
				console.log(`${payload.action}, received by AppComponent`);

        if (payload.action === 'CONFIG READY') {
          this.ready = true;
        }

				// check the menu item pressed and take action
        this.router.navigate([{
          outlets: {
            primary: ['message', 'Info', { title: 'Navigation', message: `${payload.action} received by AppComponent` }]
          }
        }]);
			}
		);

		// this is required to initiate router for messaging
		this.router.navigate([{
			outlets: {
				primary: ['message', 'Info', { title: 'Startup', message: 'Application Ready!!' }]
			}
		}]);
	}

	ngOnInit() {
		//console.log("app initialized.");
	}

	ngOnDestroy() {
		//console.log("app destroyed.");

		// prevent memory leak when component destroyed
		this.subscription.unsubscribe();
	}
}
