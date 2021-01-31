import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { ConfigService } from './service/config.service';
import { OwfContainerService } from './service/owf-container.service';
import { UserCoreService } from './service/owf-core.service';
import { ActionNotificationService } from './service/action-notification.service';

import * as _ from 'lodash';

interface IActiveItems {
	value: string;
	viewValue: string;
  }
  
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'OWFTracks11';
	subscription: Subscription;

	ready: boolean = false;
	aisUser: boolean = false;
	firstTime: boolean = true;
	menuOption: string = 'AppConfig';

	loadActiveItems: boolean = false;
	listActiveItems: IActiveItems[] = [];
	listActiveSelected: string = "";

	mainCSVSrc = "/OWFTracks/assets/images/main_csv.png";
	mainSHAPESrc = "/OWFTracks/assets/images/main_shape.png";
	mainLAYERSSrc = "/OWFTracks/assets/images/main_layers.png";
	mainSEARCHSrc = "/OWFTracks/assets/images/main_search.png";
	mainVTSSrc = "/OWFTracks/assets/images/main_vts.png";
	mainSENSORSSrc = "/OWFTracks/assets/images/main_sensors.png";
	divMainCSVCSS = {
		'z-index': 3,
		'width': 'max-content',
		'height': 'calc(100vh - 45px)',
		'margin': '0 auto',
		'padding': '5%'
	}

	constructor(private _zone: NgZone,
		private router: Router,
		private notificationService: ActionNotificationService,
		private configService: ConfigService,
		private owfContainerService: OwfContainerService,
		private owfCoreService: UserCoreService) {
		//console.log("AppComponent constructor.");

		this.subscription = this.notificationService.publisher$.subscribe(
			payload => {
				console.log(`${payload.action}/${payload.value}, received by AppComponent`);

				// check the menu item pressed and take action
				if ((payload.action === 'USERINFO READY - USER') || (payload.action === 'USERINFO READY - UUID') ||
					(payload.action === 'USERINFO READY - SUMMARY')) {
					console.log(payload.action, this.owfContainerService.getContainer());
					console.log(payload.action, this.owfCoreService.getUser());
					console.log(payload.action, this.owfCoreService.getUserUUID());
					console.log(payload.action, this.owfCoreService.getUserSummary());
				} else if (payload.action === 'USERINFO READY - GROUPS') {
					console.log(payload.action, this.owfCoreService.getUserGroups());

					this.mainCSVSrc = this.configService.getBaseHref() + "/assets/images/main_csv.png";
					this.mainSHAPESrc = this.configService.getBaseHref() + "/assets/images/main_shape.png";
					this.mainLAYERSSrc = this.configService.getBaseHref() + "/assets/images/main_layers.png";
					this.mainSEARCHSrc = this.configService.getBaseHref() + "/assets/images/main_search.png";
					this.mainVTSSrc = this.configService.getBaseHref() + "/assets/images/main_vts.png";
					this.mainSENSORSSrc = this.configService.getBaseHref() + "/assets/images/main_sensors.png";

					// update menu for roles
					let aisRoles = _.intersection(this.owfCoreService.getUserGroupNames(),
						this.configService.getConfig().aisvtsServices.roles);

					if (Array.isArray(aisRoles) && (aisRoles.length > 0)) {
						setTimeout(() => {
							this.notificationService.publisherAction({ action: 'MENU SYNC ROLES', value: { option: 'AIS', active: aisRoles.length } });
						}, 500);
						this.aisUser = true;
					}

					// component is ready
					this.ready = true;
				} else if (payload.action === "MENUITEMSELECTED") {
					if (payload.value === "Connect CSV") {
						this.menuOption = 'ServiceCSV';
						this.handleMainCSVClick(null);
					}
				} else {
					this.router.navigate([{
						outlets: {
							primary: ['message', 'Info', { title: 'Navigation', message: `${payload.value} received by AppComponent` }]
						}
					}]);
				}
			}
		);

		// this is required to initiate router for messaging
		if (this.firstTime) {
			this.router.navigate([{
				outlets: {
					primary: ['message', 'Info', { title: 'Startup', message: 'Application Ready!!' }]
				}
			}]);
		}
	}

	ngOnInit() {
		//console.log("AppComponent ngOnInit.");
	}

	ngOnDestroy() {
		//console.log("AppComponent ngOnDestroy.");

		// prevent memory leak when component destroyed
		this.subscription.unsubscribe();
	}

	handleMainCSVClick($event) {
		this.firstTime = false;

		// check if there is a item already in new state
		let notFound = true;
		this.listActiveItems.forEach(item => {
			if (item.viewValue === 'new-csv') {
				notFound = false;
			}
		});

		// add a new item to the menuActiveItems
		if (notFound) {
			let activeItem = {value: new Date().getTime().toString(16), viewValue: 'new-csv'};
			this.loadActiveItems = true;
			this.listActiveItems.push(activeItem);
			this.listActiveSelected = activeItem.value;

			this.router.navigate([{
				outlets: {
					primary: ['message', 'Success', { title: 'Navigation', message: 'Connected to CSV Module!' }],
					trackOutlet: ['service', 'connect.csv', activeItem.value, {activeItem: activeItem}],
					errorOutlet: ['']
				}
			}]);
		} else {
			this.router.navigate([{
				outlets: {
					primary: ['message', 'Info', { title: 'Navigation', message: 'new-csv item already exists, select from "ActiveList"!' }]
				}
			}]);
		}
	}
}
