import { TestBed } from '@angular/core/testing';

import { ActionNotificationService } from './action-notification.service';

describe('ActionNotificationService', () => {
  let service: ActionNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActionNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
