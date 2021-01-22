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
    this.menuItems = MenuModel;
    //this.menuItems[1].children[1].disabled = true;

    /*
    // add commands to menu model
    let items: any = this.menuItems;

    items.items[0].items[0].command = this.notifyMenu.bind(this);  // Service -> Load CSV
    items.items[0].items[1].command = this.notifyMenu.bind(this);  // Service -> Load Shape
    items.items[0].items[2].command = this.notifyMenu.bind(this);  // Service -> Load Feature
    items.items[0].items[3].command = this.notifyMenu.bind(this);  // Service -> Load SEARCH
    items.items[0].items[4].command = this.notifyMenu.bind(this);  // Service -> Load SENSORS
    items.items[0].items[5].command = this.notifyMenu.bind(this);  // Service -> Load AIS/VTS
    //items.items[1].items[0].command = this.notifyMenu.bind(this);  // help -> about
    */
  }

  ngOnDestroy() {
    //console.log("app initialized.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }

  clickMenuItem(menuItem) {
    //console.log("app destroyed.");

    console.log(menuItem);
    this.selectedMenu = menuItem.displayName;
  }

  notifyMenu(event) {
    this.notificationService.publisherAction({ action: event.item.label });
    this.searchText = event.item.label;
    //console.log(`${event.item.label}, pressed from MenuComponent`);
  }

  onSearchEnter(value: string) {
    if (value === '') {
      this.searchText = 'Search';
    } else {
      this.searchText = value;
    }

    //console.log(`search value: ${value}`);
    this.notificationService.publisherAction({ action: "search", data: value });
  }

}
