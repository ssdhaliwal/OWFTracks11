import { Component, OnInit, OnDestroy, ElementRef, ChangeDetectorRef, Input, ViewChild, NgZone } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap, retry, retryWhen, delay, take } from 'rxjs/operators';

import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import { ConfigModel } from '../../../models/config.model';
import { ConfigService } from '../../../service/config.service';
import { UserCoreService } from '../../../service/owf-core.service';
import { ActionNotificationService } from '../../../service/action-notification.service';

import * as _ from 'lodash';
import { jsUtils } from '../../../library/js-utils';
import { OwfApi } from '../../../library/owf-api';

import { AbstractControl, FormControl, Validators } from '@angular/forms';
import { Color } from '@angular-material-components/color-picker';

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
}

@Component({
  selector: 'app-csv-core',
  templateUrl: './csv-core.component.html',
  styleUrls: ['./csv-core.component.css']
})
export class CsvCoreComponent implements OnInit, OnDestroy {
  config: ConfigModel = null;
  subscription: Subscription;
  
  public isDataValid: boolean = false;
  public loadComponent: boolean = false;
  public loadMMSISync: boolean = false;

  public filename: string = "";
  public color: any = "#f38c06";
  public records: any[] = [];
  public searchValue: string;
  public geocodeAddress: boolean = false;

  colorCtr: AbstractControl = new FormControl(new Color(255, 243, 0), [Validators.required]);

  constructor(private _zone: NgZone,
    private configService: ConfigService,
    private userCoreService: UserCoreService,
    private notificationService: ActionNotificationService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef) {
  }

  ngOnInit() {
    //console.log("csv-core initialized.");
    this.isDataValid = true;
    this.loadComponent = true;
    this.loadMMSISync = false;

    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    //console.log("csv-core destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
  }
}
