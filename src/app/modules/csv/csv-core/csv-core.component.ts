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

import * as xls from 'xlsx';
import * as papa from 'papaparse';

// https://zefoy.github.io/ngx-color-picker/
import { ColorPickerService, Cmyk } from 'ngx-color-picker';

interface IMaps {
  title: string;
  id: string;
}

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

  public componentId: string = "";
  public componentName: string = "";

  public loadInitial: boolean = true;
  public isDataValid: boolean = false;
  public loadComponent: boolean = false;
  public loadMMSISync: boolean = false;

  credentialsRequired: boolean = false;
  connectionFailure: boolean = false;

  public activeItem: any;
  public isRestoreState: boolean = false;

  recordsLoaded = 0;
  recordsError = 0;
  recordsSelected = 0;
  loadStatus: string = "(no file selected!)";

  public filename: string = "";
  public color: string = "rgba(0,255,0,0.5)";
  public records: any[] = [];
  public searchValue: string;
  public geocodeAddress: boolean = false;
  public mapId: string = "M1";

  public mapList: IMaps[] = [
    { title: "M1", id: "1" },
    { title: "M2", id: "2" },
    { title: "M3", id: "3" },
    { title: "M4", id: "4" },
    { title: "M5", id: "5" },
    { title: "M6", id: "6" },
    { title: "M7", id: "7" },
    { title: "M8", id: "8" },
    { title: "M9", id: "9" },
  ];
  mapSelected: string = "1";
  isZoom: boolean = false;
  isLabel: boolean = false;

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

        if (payload.action === "CSV LAYERSYNC ENABLED") {
          this.loadMMSISync = payload.value;
          this.cdr.detectChanges();
        } else if (payload.action === "CSV INVALID DATA") {
          this.isDataValid = !payload.value;
          this.cdr.detectChanges();
        } else if (payload.action === "CSV SELECTED COUNT") {
          this.recordsSelected = payload.value;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnInit() {
    //console.log("csv-core initialized.");
    this.config = this.configService.getConfig();

    this.routeSubscription = this.route.firstChild.paramMap.subscribe(params => {
      console.log(params);
      this.componentId = params.get("id");

      //let payload = JSON.stringify(params.get("payload"));
      this.componentName = "csv-" + this.componentId;

      this.isRestoreState = false;
      this.loadInitial = true;
      this.isDataValid = false;
      this.loadComponent = false;
      this.loadMMSISync = false;

      this.restoreState(this.componentId);
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

    this.loadFile(file);
  }

  private loadFile(file) {
    //console.log("csv-core loadFile.");

    this.records = [];
    this.searchValue = "";

    this.recordsSelected = 0;
    this.recordsError = 0;
    this.recordsLoaded = 0;

    this.loadComponent = false;
    this.cdr.detectChanges();

    this.loadMMSISync = false;
    if (this.isValidCSVFile(file)) {
      let reader = new FileReader();

      this.filename = file.name;
      if (file.name.endsWith("csv")) {
        reader.readAsText(file);

        reader.onload = () => {
          let csvData = reader.result;
          let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);

          this.recordsLoaded = 0;
          this.recordsError = 0;
          this.recordsSelected = 0;

          let parsedValue;
          let count = 0, error = 0;
          csvRecordsArray.forEach((value) => {
            parsedValue = papa.parse(value);

            if (parsedValue.errors[0] !== undefined) {
              error++;
            } else {
              count++;
              this.records.push(parsedValue.data[0]);
            }
          });

          this.recordsLoaded = count;
          this.recordsError = error;
          this.loadStatus = "(records loaded: " + count + ", error: " + error + ")";
          this.loadComponent = true;
          this.loadInitial = false;
        };

        reader.onerror = function () {
          console.log('error is occured while reading file!');
        };
      } else {
        reader.readAsArrayBuffer(file);
        reader.onload = () => {
          let xlsData: ArrayBuffer = <ArrayBuffer>reader.result;
          var data = new Uint8Array(xlsData);
          var workbook = xls.read(data, { type: 'array' });
          var firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          // header: 1 instructs xlsx to create an 'array of arrays'
          var result = xls.utils.sheet_to_json(firstSheet, { header: 1 });

          // data preview
          let count = 0, error = 0;
          result.forEach((item, index) => {
            count++;
            this.records.push(item);
          });

          this.loadStatus = "(records loaded: " + count + ", error: " + error + ")";
          this.loadComponent = true;
          this.loadInitial = false;
        };
      }
    } else {
      window.alert("Please import valid .csv file.");
      this.loadInitial = true;

      this.isDataValid = false;
      this.loadComponent = false;
      this.loadMMSISync = false;
    }
  }

  handleResetClick($event) {
    //console.log("csv-core handleResetClick.");
    this.loadMMSISync = false;
    this.loadComponent = false;
    this.isDataValid = false;

    this.componentName = "new-csv";
    this.notificationService.publisherAction({ action: 'ACTIVELIST DATA LOADED', value: { option: 'CSV', id: this.componentId, value: this.componentName } });

    this.configService.removeMemoryValue(this.componentId);
    this.loadInitial = true;
  }

  handleShareClick($event) {
    //console.log("csv-core handleShareClick.");
    this.notificationService.publisherAction({
      action: 'CSV SAVE TO CATALOG', value: {
        showLabels: this.isLabel,
        color: this.color, showZoom: this.isZoom, mapId: this.mapId
      }
    });
  }

  handleLayerSelected($event) {
    //console.log("csv-core handleLayerSelected.");
    let selectedUUID = $event.value;

    // change ui state and force change
    if (selectedUUID !== null) {
      this.layersDefinition.forEach((value, index) => {
        if (value.uuid === selectedUUID) {
          this.layerSelected = value;
          this.notificationService.publisherAction({ action: 'CSV LAYERSYNC LAYERINFO', value: value });
        }
      });
    } else {
      this.notificationService.publisherAction({ action: 'CSV LAYERSYNC LAYERINFO', value: null });
    }
  }

  handleLayerRefresh($event) {
    //console.log("csv-core handleLayerRefresh.");
    this.handleLayerSelected({ source: null, value: this.layerSelected.uuid });
  }

  handleSearchClear($event) {
    //console.log("csv-core handleSearchClear.");

    this.searchValue = "";
    this.notificationService.publisherAction({ action: 'CSV SEARCH VALUE', value: "" });

    this.recordsSelected = 0;
  }

  handleSearch($event) {
    //console.log("csv-core handleSearch.");

    if ($event.key === "Enter") {
      this.searchValue = (this.searchValue + "").trim();
      this.notificationService.publisherAction({ action: 'CSV SEARCH VALUE', value: this.searchValue });

      if (!this.searchValue) {
        this.recordsSelected = 0;
      }
    }
  }

  handleMapSelected($event) {
    //console.log("csv-core handleMapSelected.");

    this.mapId = this.mapSelected;
    this.sendOptionsUpdate();
  }

  handleMapClick($event) {
    //console.log("csv-core handleMapClick.");

    this.notificationService.publisherAction({
      action: 'CSV PLOT ON MAP', value: {
        showLabels: this.isLabel,
        color: this.color, showZoom: this.isZoom, mapId: this.mapId
      }
    });
  }

  handleZoomClick($event) {
    //console.log("csv-core handleZoomClick.");

    this.isZoom = !this.isZoom;
    this.sendOptionsUpdate();
  }

  handleLabelClick($event) {
    //console.log("csv-core handleLabelClick.");

    this.isLabel = !this.isLabel;
    this.sendOptionsUpdate();
  }

  handleColorChange($event) {
    this.color = $event;
    this.sendOptionsUpdate();
  }

  sendOptionsUpdate() {
    this.notificationService.publisherAction({
      action: 'CSV OPTIONS UPDATED', value: {
        zoom: this.isZoom, label: this.isLabel, color: this.color, mapId: this.mapId
      }
    });
  }

  handleFileChangeNotification(params) {
    //console.log("csv-core handleFileChangeNotification.");

    // value = {option: "CSV", id: "1775e170010", value: "csv-monitor_format.txt"[, removeId: ""]}
    let removeId = "";
    if (params.hasOwnProperty("removeId")) {
      removeId = params.removeId;
      this.configService.removeMemoryValue(removeId);
    }

    // store current state and restore id
    if (params.id !== this.componentId) {
      this.configService.setMemoryValue(this.componentId, {
        componentId: this.componentId,
        componentName: this.componentName,
        columns: {},
        data: {},
        filters: {},
        view: {}
      });

      // reset the component grid
      this.loadComponent = false;

      // find swap item state and restore
      let config = this.configService.getMemoryValue(params.id);
    }
  }

  private getDirectoryLayers() {
    //console.log("csv-core getDirectoryLayers.");
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

  private isValidCSVFile(file: any) {
    //console.log("csv-core isValidCSVFile.");

    return (!file ? false : (file.name.endsWith(".csv") || file.name.endsWith(".xls") || file.name.endsWith(".xlsx")));
  }

  private restoreState(id) {
    //console.log("csv-core restoreState.");

    let options = this.configService.getMemoryValue(id);
    // api.paginationGoToPage(4)

    if (options) {
      this.isRestoreState = true;

      this.filename = options.filename;
      this.geocodeAddress = options.geocode;
      this.searchValue = options.search;
      this.color = options.color;
      this.isLabel = options.isLabel;
      this.isZoom = options.isZoom;
      this.mapId = options.mapId;

      this.layerSelected = options.layer;
      this.mmsiLayers = options.layers;

      this.records = options.data;
    }
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
