import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActionNotificationService {
  // Observable string sources
  private publisherSource = new Subject<any>();
  private subscriberSource = new Subject<any>();

  // Observable string streams
  publisher$ = this.publisherSource.asObservable();
  subscriber$ = this.subscriberSource.asObservable();

  constructor() {
		//console.log("ActionNotificationService handleError.");
  }

  // Service message commands
  publisherAction(item: any) {
		//console.log("ActionNotificationService publisherAction.");

    this.publisherSource.next(item);
  }

  subscriberAction(item: any) {
		//console.log("ActionNotificationService subscriberAction.");

    this.subscriberSource.next(item);
  }
}