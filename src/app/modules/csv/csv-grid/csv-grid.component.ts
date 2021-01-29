import { Component, OnInit, OnDestroy, ElementRef, Input, ViewChild } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap, retry, retryWhen, delay, take } from 'rxjs/operators';

import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import * as _ from 'lodash';
import { OwfApi } from '../../../library/owf-api';

import { GridOptions } from "ag-grid-community";
import { AllCommunityModules, Module } from "@ag-grid-community/all-modules";

import { AgGridAngular } from 'ag-grid-angular';

import { CsvToKmlWorker } from '../web-workers/csv-to-kml.worker';

import { ConfigModel } from '../../../models/config.model';
import { ConfigService } from '../../../service/config.service';
import { ActionNotificationService } from '../../../service/action-notification.service';

import { jsUtils } from '../../../library/js-utils';

@Component({
  selector: 'app-csv-grid',
  templateUrl: './csv-grid.component.html',
  styleUrls: ['./csv-grid.component.css']
})
export class CsvGridComponent implements OnInit, OnDestroy {
  config: ConfigModel = null;
  subscription: Subscription;

  @Input()
  parentFileName: string;

  @Input()
  parentData: any[];

  @Input()
  parentMessage: string;

  @Input()
  parentColor: string;

  @Input()
  parentGeocode: boolean;

  constructor(private configService: ConfigService,
    private http: HttpClient,
    private notificationService: ActionNotificationService) {
    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        console.log(`${payload.action}/${payload.value}, received by CsvGridComponent`);
      });
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    //console.log("csv-grid destroyed.");
  }
}