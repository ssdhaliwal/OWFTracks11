import { Component, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { ActionNotificationService } from '../../service/action-notification.service';
import { MenuItem, MenuModel } from '../../models/menu.model';

@Component({
  selector: 'app-menu-child',
  templateUrl: './menu-child.component.html',
  styleUrls: ['./menu-child.component.css']
})
export class MenuChildComponent implements OnInit, OnDestroy {
  @Input() childMenuItems: MenuItem[];
  @ViewChild('childMenu', { static: true }) public childMenu;

  subscription: Subscription;

  constructor(private notificationService: ActionNotificationService) {
		//console.log("MenuChildComponent constructor.");

    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        // console.log(`${payload.action}, received by MenuComponent`);
      }
    );
  }

  ngOnInit(): void {
		//console.log("MenuChildComponent ngOnInit.");

  }

  ngOnDestroy(): void {
		//console.log("MenuChildComponent ngOnDestroy.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }

  clickMenuItem(menuItem) {
		//console.log("MenuChildComponent clickMenuItem.");

    console.log(menuItem);
    this.notificationService.publisherAction({ action: 'MENUITEMSELECTED', value: menuItem.displayName });
  }

}
