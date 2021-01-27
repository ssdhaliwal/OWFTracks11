import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { ActionNotificationService } from '../../service/action-notification.service';
import { MenuItem, MenuModel } from '../../models/menu.model';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit, OnDestroy {
  menuItems: MenuItem[];
  subscription: Subscription;

  selectedMenu: string = "{idle}";

  searchText: string = 'Search';
  isAvailable: boolean = false;

  constructor(private notificationService: ActionNotificationService) {
		//console.log("MenuComponent constructor.");

    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        // console.log(`${payload.action}, received by MenuComponent`);
        if (payload.action === "MENUITEMSELECTED") {
          this.selectedMenu = payload.value;
        } else if (payload.action === "MENU SYNC ROLES") {
          if (payload.value.option === "AIS") {
            if (payload.value.active > 0) {
            }
          }
        }
      }
    );
  }

  ngOnInit(): void {
		//console.log("MenuComponent ngOnInit.");

    this.menuItems = MenuModel;
  }

  ngOnDestroy() {
		//console.log("MenuComponent ngOnDestroy.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }

  clickMenuItem(menuItem) {
		//console.log("MenuComponent clickMenuItem.");

    this.selectedMenu = menuItem.displayName;
  }

}
