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
              let items: any = this.menuItems;
              // items.items[0].items[5].visible = true;
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

    console.log(menuItem);
    this.selectedMenu = menuItem.displayName;
  }

  notifyMenu(event) {
		//console.log("MenuComponent notifyMenu.");

    this.notificationService.publisherAction({ action: event.item.label });
    this.searchText = event.item.label;
  }

  onSearchEnter(value: string) {
		//console.log("MenuComponent onSearchEnter.");

    if (value === '') {
      this.searchText = 'Search';
    } else {
      this.searchText = value;
    }

    this.notificationService.publisherAction({ action: "search", data: value });
  }

}
