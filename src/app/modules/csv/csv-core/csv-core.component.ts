import { Component, OnInit, OnDestroy, ElementRef, ChangeDetectorRef, Input, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { ColorPickerService, Cmyk } from 'ngx-color-picker';

interface ILayers {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-csv-core',
  templateUrl: './csv-core.component.html',
  styleUrls: ['./csv-core.component.css']
})
export class CsvCoreComponent implements OnInit, OnDestroy {
  config: ConfigModel = null;
  subscription: Subscription;
  routeSubscription: Subscription;
  
  public isDataValid: boolean = false;
  public loadComponent: boolean = false;
  public loadMMSISync: boolean = false;

  public activeItem: any;

  public filename: string = "";
  public color: string = "rgba(0,255,0,0.5)";
  public records: any[] = [];
  public searchValue: string;
  public geocodeAddress: boolean = false;

  public mmsiLayers: ILayers[] = [
    {value: 'steak-0', viewValue: 'Steak'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos'}
  ];

  constructor(private _zone: NgZone,
    private route: ActivatedRoute,
    private configService: ConfigService,
    private userCoreService: UserCoreService,
    private notificationService: ActionNotificationService,
    private http: HttpClient,
    private cpService: ColorPickerService,
    private cdr: ChangeDetectorRef) {
    //console.log("csv-core constructor.");

    this.subscription = notificationService.publisher$.subscribe(
        payload => {
          console.log(`${payload.action}/${payload.value}, received by CsvCoreComponent`);
          console.log(payload);
        });
  }

  ngOnInit() {
    //console.log("csv-core initialized.");
    
    this.routeSubscription = this.route.firstChild.paramMap.subscribe(params => {
      console.log(params);
    });

    this.isDataValid = true;
    this.loadComponent = true;
    this.loadMMSISync = true;

    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    //console.log("csv-core destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
    this.routeSubscription.unsubscribe();
  }
}
