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
  @Input() selectedMenu: String = "";
  @ViewChild('childMenu', {static: true}) public childMenu: any;

  subscription: Subscription;

  constructor(private notificationService: ActionNotificationService) { 
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        // console.log(`${payload.action}, received by MenuComponent`);
      }
    );
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  clickMenuItem(menuItem) {
    console.log(menuItem);
    this.selectedMenu = menuItem.displayName;
  }

}
