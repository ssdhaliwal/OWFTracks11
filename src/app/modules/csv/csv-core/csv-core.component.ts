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
  title: string;
  uuid: string;
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
  
  jsutils = new jsUtils();
  owfapi = new OwfApi();

  componentId: string = "";
  componentName: string = "";

  public loadInitial: boolean = true;
  public isDataValid: boolean = false;
  public loadComponent: boolean = false;
  public loadMMSISync: boolean = false;

  credentialsRequired: boolean = false;
  connectionFailure: boolean = false;

  public activeItem: any;

  public filename: string = "";
  public color: string = "rgba(0,255,0,0.5)";
  public records: any[] = [];
  public searchValue: string;
  public geocodeAddress: boolean = false;

  public mmsiLayers: ILayers[] = [{ title: "-- SELECT LAYER --", uuid: null }];
  layersDefinition: any[] = [];
  layerSelected: ILayers;

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

          if (payload.action === "ACTIVELIST DATA SWAP") {
            this.handleFileChangeNotification(payload);
          }
        });
  }

  ngOnInit() {
    //console.log("csv-core initialized.");
    this.config = this.configService.getConfig();
    
    this.routeSubscription = this.route.firstChild.paramMap.subscribe(params => {
      console.log(params);
      this.componentId = params.get("id");

      let payload = JSON.stringify(params.get("payload"));
      this.componentName = "csv-" + this.componentId;

      this.loadInitial = true;
      this.isDataValid = false;
      this.loadComponent = false;
      this.loadMMSISync = false;
  
      this.cdr.detectChanges();
    });

    // load directory if provided
    this.getDirectoryLayers();
  }

  ngOnDestroy() {
    //console.log("csv-core destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();
    this.routeSubscription.unsubscribe();
  }

  handleFileRequest($event) {
    //console.log("csv-core handleFileRequest.");

    let file = $event.files[0];
    console.log(file);

    this.loadInitial = false;
    this.componentName = "csv-" + file.name;

    this.notificationService.publisherAction({ action: 'ACTIVELIST DATA LOADED', value: { option: 'CSV', id: this.componentId, value: this.componentName } });

    this.isDataValid = true;
    this.loadComponent = true;
    this.loadMMSISync = true;
  }

	handleFileChangeNotification(params) {
		//console.log("AppComponent handleFileChangeNotification.");

    console.log(params);
    // value = {option: "CSV", id: "1775e170010", value: "csv-monitor_format.txt"}
    // store current state
    // find swap item state and restore
  }
  
  private getDirectoryLayers() {
    let userGroups = this.userCoreService.getUserGroupNames();

    let selectedLayer;
    this.connectionFailure = true;
    
    const headers = new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8');
    this.config.directories.forEach((directory) => {
      let directoryObserable: Observable<any> = this.http
        .get(directory.path, { headers, responseType: 'text', withCredentials: true })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError)/*, tap(console.log)*/);

      let directorySubscription = directoryObserable.subscribe(
        (jsonCollection) => {
          this.connectionFailure = false;
          directorySubscription.unsubscribe();

          let directoryCollection = JSON.parse(jsonCollection);
          directoryCollection.directory.forEach((services) => {
            // retrieve the directory and get layer list
            let layerType = "feature";
            let layerParams = this.config.layerParam.defaults;
            let layerUrl = "";
            let layerMSG, newItem;
            let urlParser, layerHost = "";

            // check roles to for command set option in infotemplate
            let userAllowed = true;
            if ((services.properties !== undefined) && (services.properties.role !== undefined)) {
              userAllowed = false;
              services.properties.role.forEach((role) => {
                if (userGroups.indexOf(role.toUpperCase()) >= 0) {
                  userAllowed = true;
                }
              });
            }

            if (userAllowed) {
              services.layer.services.forEach((service) => {
                service["uuid"] = this.jsutils.uuidv4();
                service.tempArea = {};

                layerType = service.params.serviceType || services.layer.params.serviceType || "feature";
                if (layerType === "feature") {
                  layerType = "arcgis-feature";

                  // process the layer into definition

                  // copy layer params from top level
                  if (services.layer.params) {
                    Object.keys(services.layer.params).forEach((param) => {
                      layerParams[param] = services.layer.params[param];
                    });
                  }

                  // copy layer service params
                  if (service.params) {
                    Object.keys(service.params).forEach((param) => {
                      layerParams[param] = service.params[param];
                    });
                  }

                  // cleanup params
                  delete layerParams.serviceType;
                  delete layerParams.url;
                  delete layerParams.data;
                  delete layerParams.zoom;
                  delete layerParams.refresh;
                  delete layerParams._comment;
                  delete layerParams.intranet;

                  // copy the default overrides
                  if (directory.layerParam.overrides) {
                    Object.keys(directory.layerParam.overrides).forEach((param) => {
                      layerParams[param] = directory.layerParam.overrides[param];
                    });
                  }

                  // update service url
                  layerUrl = service.url || services.properties.url;
                  if ((service.params.layers !== undefined) && (service.params.layers !== null)) {
                    layerUrl = layerUrl +
                      ((layerUrl.endsWith("/")) ? "" : "/") + service.params.layers;
                  }
                  if ((services.properties.token !== undefined) && (services.properties.token !== null)) {
                    urlParser = new URL(layerUrl);
                    layerHost = urlParser.host;

                    // get the token if available; else parse it
                    this.config.tokenServices.forEach((service) => {
                      if ((service.serviceUrl !== undefined) && (service.serviceUrl !== null) &&
                        (service.serviceUrl === layerHost)) {
                        if (layerUrl.includes("?")) {
                          layerUrl += "&token=" + service.token;
                        } else {
                          layerUrl += "?token=" + service.token;
                        }
                      }
                    });
                  }

                  // create the service message for layerDefinition
                  layerMSG = {};
                  layerMSG.overlayId = directory.name;
                  layerMSG.featureId = service.name;
                  layerMSG.name = service.name;
                  layerMSG.format = layerType;
                  layerMSG.params = layerParams;
                  if ((service.params.zoom !== undefined) || (service.params.zoom !== null)) {
                    layerMSG.zoom = service.params.zoom;
                  }

                  layerMSG.mapId = 1;
                  layerMSG.url = layerUrl;
                  layerMSG["uuid"] = service["uuid"];
                  layerMSG.tempArea = {};

                  // check roles to for command set option in infotemplate

                  // add the new item
                  newItem = { title: (layerMSG.name + "/" + layerMSG.overlayId), uuid: service.uuid };
                  if (!selectedLayer) {
                    selectedLayer = newItem;
                  }

                  // trigger angular binding
                  this.mmsiLayers = [...this.mmsiLayers, newItem];
                  this.layersDefinition = [...this.layersDefinition, layerMSG];
                }
              });
            }
          });
        },
        error => {
          console.log('HTTP Error', error);
        },
        () => {
          if (!this.connectionFailure) {
            //console.log('HTTP request completed.');
          } else {
            window.alert('OPS Track Widget: HTTP other layer error; not trapped.\n' +
              directory);
          }
        });
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    return throwError(errorMessage);
  }
}
