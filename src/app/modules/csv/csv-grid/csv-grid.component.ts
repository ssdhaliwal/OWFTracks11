import { Component, OnInit, OnDestroy, ElementRef, Input, ViewChild, NgZone, ChangeDetectorRef } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap, retry, retryWhen, delay, take } from 'rxjs/operators';

import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import * as _ from 'lodash';
import { OwfApi } from '../../../library/owf-api';

import { GridOptions } from "ag-grid-community";
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
  parentId: string;

  @Input()
  parentName: string;

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

  @Input()
  parentMapId: string;

  @Input()
  parentRestoreState: boolean;

  @Input()
  parentLayers: any[];

  parentZoom: boolean = false;
  parentLabels: boolean = false;
  parentLayer: any = {};
  parentSearch: string = "";

  jsutils = new jsUtils();
  owfapi = new OwfApi();
  worker: CsvToKmlWorker;

  credentialsRequired: boolean = false;
  connectionFailure: boolean = false;

  divQueryStatusCss = {
    'display': 'none',
    'width': '100%',
    'background-color': 'gold',
    'z-index': '99',
    'position': 'fixed',
    'color': 'black'
  }
  queryStatusMessage = "please wait, querying services...";

  divLayerExportCss = {
    'z-index': 3,
    'width': '22px',
    'height': '22px',
    'display': 'flex',
    'position': 'absolute',
    'top': 'calc(100vh - 30px)'
  }
  layerExportImageSrc = "/OWFTracks/assets/images/save_alt.svg";

  @ViewChild('agGridCSV') agGrid: AgGridAngular;

  gridApi;
  gridColumnApi;
  getRowNodeId;
  gridOptions: GridOptions;
  columnDefinitions: any = [];
  paginationPageSize: 25;

  rowHeaders: any[] = [];
  rowData: any[] = [];
  rowDataUpdate: any[] = [];
  // title/name, lat, lon, course, bearing, speed, address, street, city, state, zip, country
  columnTracking: any[] = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
  filterActive: boolean = false;
  mmsiList: string[] = [];
  mmsiListBatch: any[] = [];
  mmsiListBatchIndex: 0;
  selectedNodesCache: any[] = [];
  geocodeRecord: any;
  geocodeRecords: any[] = [];
  recordsSelected = 0;

  domLayout = "normal";
  rowSelection = "multiple";

  layerBaseUrl: string = "";
  layerServiceUrl: string = "";
  layerToken: string = "";
  layerRecords: number = 0;
  layerFields: any[] = [];
  layerTitleField: string = "";
  layerOffset: number = 0;
  layerMaxRecords: number = 1000;
  layerIDField: string = "";
  layerAdvancedFeatures: any;
  layerMMSIFieldName = "";
  layerCOURSEFieldName = "";
  layerBEARINGFieldName = "";
  layerSPEEDFieldName = "";

  getRowStyle = function (params) {
    if (params.node.selected) {
      if ((params.data["*UPD*"] !== undefined) && (params.data["*UPD*"] === "Y")) {
        return { 'background-color': '#3CD94F' };
      } else {
        return { 'background-color': '#D88F36' };
      }
    } else if ((params.data["*UPD*"] !== undefined) && (params.data["*UPD*"] === "Y")) {
      return { 'background-color': '#258731' };
    } else {
      return { 'background-color': 'white' };
    }
  }

  constructor(private _zone: NgZone,
    private configService: ConfigService,
    private http: HttpClient,
    private notificationService: ActionNotificationService,
    private cdr: ChangeDetectorRef) {
    //console.log("csv-grid constructor.");

    this.subscription = notificationService.publisher$.subscribe(
      payload => {
        //console.log(`${payload.action}, received by csv-grid.component`);

        if (payload.action === "CSV LAYERSYNC LAYERINFO") {
          this.parentLayer = payload.value;

          this.credentialsRequired = false;
          if (this.parentLayer !== null) {
            this.getLayerInfo();
          }
        } else if (payload.action === "CSV OPTIONS UPDATED") {
          this.parentColor = payload.value.color;
          this.parentMapId = payload.value.mapId;
          this.parentZoom = payload.value.zoom;
          this.parentLabels = payload.value.label;

          this.saveState();
        } else if (payload.action === "CSV SEARCH VALUE") {
          this.parentSearch = payload.value;
          //this.gridApi.onFilterChanged();

          this.gridApi.deselectAll();
          this.gridApi.deselectAllFiltered();

          this.gridApi.redrawRows({ rowNodes: this.selectedNodesCache });
          this.selectedNodesCache = this.gridApi.getSelectedNodes();

          if (this.parentSearch !== "") {
            this.filterActive = true;
          } else {
            this.filterActive = false;
          }

          this.gridApi.setQuickFilter(this.parentSearch);
          if (this.filterActive) {
            let selectedRows = this.gridApi.getSelectedRows();
            if (selectedRows.length !== 0) {
              this.recordsSelected = selectedRows.length;
            } else {
              this.recordsSelected = 0;
              this.gridApi.forEachNodeAfterFilter((node, index) => {
                this.recordsSelected++;
              });
            }
          } else {
            this.recordsSelected = 0;
          }
          this.cdr.detectChanges();
        } else if ((payload.action === "CSV PLOT ON MAP") || (payload.action === "CSV SAVE TO CATALOG")) {
          let tracks = [];
          if (this.filterActive) {
            let selectedRows = this.gridApi.getSelectedRows();
            if (selectedRows.length !== 0) {
              tracks = selectedRows;
            } else {
              this.gridApi.forEachNodeAfterFilter((node, index) => {
                tracks.push(node.data);
              });
            }
          } else {
            let selectedRows = this.gridApi.getSelectedRows();
            if (selectedRows.length !== 0) {
              tracks = selectedRows;
            } else {
              tracks = this.rowData;
            }
          }

          this.parentZoom = payload.value.showZoom;
          this.parentLabels = payload.value.showLabels;
          this.parentColor = payload.value.color;
          this.parentMapId = payload.value.mapId;

          this.plotMarker(tracks, (payload.action === "CSV SAVE TO CATALOG"), false);
        }
      });
  }

  ngOnInit() {
    //console.log("csv-grid created.");
    this.config = this.configService.getConfig();
    this.layerExportImageSrc = this.configService.getBaseHref() + "/assets/images/save_alt.svg";

    this.gridOptions = <GridOptions>{
      rowData: this.rowData,
      columnDefs: this.createColumnDefs(),
      context: {
        componentParent: this
      },
      pagination: true
    };

    // create inline worker
    this.worker = new CsvToKmlWorker(() => {
      // START OF WORKER THREAD CODE

      const kmlHeader = "<kml xmlns=\"http://www.opengis.net/kml/2.2\"> " +
        "<Document> " +
        "    <name>StyleMap.kml</name> " +
        "    <open>1</open> ";
      const kmlFooter = "</Document></kml>";

      const plotMessage = {
        "overlayId": "CSV-Viewer",
        "featureId": "",
        "feature": undefined,
        "name": "",
        "zoom": true,
        "params": {
          "zoom": true,
          "showLabels": "true",
          "opacity": 0.55
        },
        "mapId": 1
      };

      const formatKml = (data) => {
        let kmlStyles = "";
        kmlStyles = "      <Style id=\"csv_style\"><IconStyle><scale>.8</scale><color>" + data.color + "</color></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
          "<Style id=\"csv_notfound\"><IconStyle><scale>.8</scale><color>" + data.color + "</color></IconStyle><LabelStyle><scale>0.5</scale></LabelStyle></Style> " +
          "<Style id=\"csv_found\"><IconStyle><color>" + data.color + "</color><scale>1.0</scale><Icon><href>" + data.baseUrl + "/assets/images/aisSquare.png</href></Icon></IconStyle></Style> ";

        plotMessage.overlayId = data.overlayId;
        plotMessage.featureId = data.filename;
        if (data.tracks.length === 1) {
          plotMessage.featureId = (data.filename + "_" + data.tracks[0][data.columnTracking[0]]).replace(/ /gi, "_");
        } else {
          plotMessage.featureId = (data.filename + "_Collection");
        }
        plotMessage.name = plotMessage.featureId;

        plotMessage.params.showLabels = data.showLabels;
        plotMessage.zoom = data.showZoom;
        plotMessage.params.zoom = data.showZoom;
        plotMessage.mapId = data.mapId.replace("M", "");

        // format and return to main thread
        let kmlPayload = "";
        let coords, lonX, latY;
        data.tracks.forEach(track => {
          // check if geom is provided
          if (data.columnTracking[2] === data.columnTracking[1]) {
            if (track[data.columnTracking[1]].includes(";")) {
              coords = track[data.columnTracking[1]].replace("POINT(", "").replace(")", "").split(";")
              lonX = coords[0];
              latY = coords[1];
            } else {
              coords = track[data.columnTracking[1]].replace("POINT(", "").replace(")", "").split(" ");
              lonX = coords[0];
              latY = coords[1];
            }
          } else {
            lonX = track[data.columnTracking[2]];
            latY = track[data.columnTracking[1]];
          }
          kmlPayload += "<Placemark> " +
            "<name>" + (track[data.columnTracking[0]] + "").replace(/\&/g, "&amp;") + "</name> ";

          if (!data.mmsiEnabled) {
            if (track.hasOwnProperty("icon") && ((track.icon || "") !== "")) {
              if (track.icon.startsWith("http") || track.icon.startsWith("/")) {
                kmlPayload += "<Style><IconStyle><Icon><href>" + track.icon + "</href></Icon></IconStyle></Style>";
              } else if (track.icon.includes(".")) {
                kmlPayload += "<Style><IconStyle><Icon><href>/GlobalRepo/Images/Core/" + track.icon + "</href></Icon></IconStyle></Style>"
              } else if (!track.icon.includes(".")) {
                kmlPayload += "<Style><IconStyle><Icon><href>milstd:" + track.icon + "</href></Icon></IconStyle></Style>"
              }
            } else {
              kmlPayload += "<styleUrl>#csv_style</styleUrl> ";
            }
          } else {
            if ((track["*UPD*"] !== undefined) && (track["*UPD*"] === "Y")) {
              kmlPayload += "<styleUrl>#csv_found</styleUrl> ";
              if ((data.columnTracking[3] !== -1) && (track[data.columnTracking[3]] !== undefined) &&
                (track[data.columnTracking[3]] !== null) && (track[data.columnTracking[3]] !== "")) {
                kmlPayload += "<Style><IconStyle><heading>" + track[data.columnTracking[3]] + "</heading></IconStyle></Style>";
              }
            } else {
              kmlPayload += "<styleUrl>#csv_notfound</styleUrl> ";
            }
          }

          kmlPayload +=
            "<Point><coordinates>" + lonX + "," + latY + ",0" + "</coordinates></Point> ";

          kmlPayload += "<ExtendedData>";
          Object.keys(track).forEach((key, index) => {
            let value = track[key];

            if (((typeof value === "string") && (value !== undefined) && (value !== null)) &&
              (value.includes(":") || value.includes("/") || value.includes("&") || value.includes("=") || value.includes("?") ||
                value.includes("<") || value.includes(">"))) {
              value = encodeURIComponent(value);
            }

            kmlPayload += "<Data name=\"" + (key + "").replace(/\&/g, "&amp;") + "\"><value>" + (value + "").replace(/\&/g, "&amp;") + "</value></Data>";
          });
          kmlPayload += "</ExtendedData></Placemark>";
        });

        plotMessage.feature = kmlHeader + kmlStyles + kmlPayload + kmlFooter;

        // this is from DedicatedWorkerGlobalScope ( because of that we have postMessage and onmessage methods )
        // and it can't see methods of this class
        // @ts-ignore
        postMessage({
          status: "kml formatting complete", kml: plotMessage, saveToCatalog: data.saveToCatalog
        });

        plotMessage.feature = "";
      };

      // @ts-ignore
      onmessage = (evt) => {
        formatKml(evt.data);
      };
      // END OF WORKER THREAD CODE
    });

    this.worker.onmessage().subscribe((event) => {
      this.owfapi.sendChannelRequest("map.feature.plot", event.data.kml);

      if (event.data.saveToCatalog) {
        this.owfapi.sendChannelRequest("catalog.favorite.add", event.data.kml);
      }

      this.setQueryStatus("", "reset");
    });

    this.worker.onerror().subscribe((data) => {
      console.log(data);
    });
  }

  ngOnDestroy() {
    //console.log("csv-grid destroyed.");

    // prevent memory leak when component destroyed
    this.subscription.unsubscribe();

    if (this.worker) {
      this.worker.terminate();
    }
  }

  sendNotification(payload) {
    //console.log("csv-grid sendNotification.");

    this.notificationService.publisherAction(payload);
    //console.log(`${payload.action}, pressed from csv-grid.component`);
  }

  private createColumnDefs() {
    //console.log("csv-grid createColumnDefs.");

    this.columnDefinitions = [];
    this.rowHeaders = [];

    if (this.parentData.length > 0) {
      let header = this.parentData[0];

      let titleIndex = -1, latIndex = -1, lonIndex = -1, courseIndex = -1, bearingIndex = -1, speedIndex = -1,
        addressIndex = -1, streetIndex = -1, cityIndex = -1, stateIndex = -1, zipIndex = -1, countryIndex = -1;
      let itemTemp = "", geom;
      let mmsiFound = false, updFound = false;
      header.forEach((item) => {
        item = item.replace(/[^0-9a-z -_]/gi, '').substring(0, 20);
        itemTemp = item.toLowerCase();

        if (itemTemp === "icon") {
          item = itemTemp;
        }

        this.rowHeaders.push(item);
        this.columnDefinitions.push({
          field: item,
          sortable: true,
          filter: true,
          resizable: true
        });

        // set column tracking for parsing
        if ((itemTemp === "title") || (itemTemp === "name")) {
          titleIndex = item;
        } else if (itemTemp === "course") {
          courseIndex = item;
        } else if (itemTemp === "bearing") {
          bearingIndex = item;
        } else if (itemTemp === "speed") {
          speedIndex = item;
        } else if (itemTemp === "address") {
          if ((addressIndex === -1) && (streetIndex === -1)) {
            addressIndex = item;
          }
        } else if (itemTemp === "street") {
          if ((addressIndex === -1) && (streetIndex === -1)) {
            streetIndex = item;
          }
        } else if (itemTemp === "city") {
          cityIndex = item;
        } else if (itemTemp === "state") {
          stateIndex = item;
        } else if ((itemTemp === "zip") || (itemTemp === "zipcode")) {
          zipIndex = item;
        } else if (itemTemp === "country") {
          countryIndex = item;
        } else if (itemTemp === "*upd*") {
          updFound = true;
        } else if (((itemTemp.includes("title")) || (itemTemp.includes("name"))) &&
          (titleIndex === -1)) {
          titleIndex = item;
        } else if (((itemTemp === "latitude") || (itemTemp === "lat") ||
          (itemTemp === "coordy") || (itemTemp === "pointy") || (itemTemp === "y")) &&
          (latIndex === -1)) {
          latIndex = item;
        } else if (((itemTemp === "longitude") || (itemTemp === "lon") ||
          (itemTemp === "coordx") || (itemTemp === "pointx") || (itemTemp === "x")) &&
          (lonIndex === -1)) {
          lonIndex = item;
        } else if (itemTemp === "geom") {
          latIndex = item;
          lonIndex = item;
        } else if ((itemTemp === "point") || (itemTemp === "x/y") || (itemTemp === "x;y")) {
          latIndex = item;
          lonIndex = item;
        } else if (itemTemp === "mmsi") {
          mmsiFound = true;
        }
      });

      // tracking for data parsing
      if (mmsiFound && !updFound) {
        this.rowHeaders.push("*UPD*");
        this.columnDefinitions.push({
          field: "*UPD*",
          sortable: true,
          filter: true,
          resizable: true
        });
      }
      if (mmsiFound) {
        this.notificationService.publisherAction({ action: 'CSV LAYERSYNC ENABLED', value: true })
      }
      this.columnTracking = [titleIndex, latIndex, lonIndex, courseIndex, bearingIndex, speedIndex,
        addressIndex, streetIndex, cityIndex, stateIndex, zipIndex, countryIndex];

      // remove header row from imported data
      this.parentData.splice(0, 1);
    }

    return this.columnDefinitions;
  }

  handleGridReady(params) {
    //console.log("csv-grid handleGridReady.");

    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;

    this.updateGridData();

    // autosize all columns
    let allColumnIds = [];
    this.gridColumnApi.getAllColumns().forEach(function (column) {
      allColumnIds.push(column.colId);
    });
    this.gridColumnApi.autoSizeColumns(allColumnIds, false);

    if ((this.columnTracking[0] === -1) ||
      (this.columnTracking[1] === -1) || (this.columnTracking[2] === -1)) {
      window.alert('CSV/XLS import data invalid; (no name/title, lat/latitude, or lon/logitude columns found!)');
      this.notificationService.publisherAction({ action: 'CSV INVALID DATA', value: true });
    } else {
      this.notificationService.publisherAction({ action: 'CSV INVALID DATA', value: false });
    }

    // if geocode (and address or street need to be provided)
    if (this.parentGeocode && ((this.columnTracking[6] !== -1) || (this.columnTracking[7] !== -1))) {
      let queueTimer = setTimeout(() => {
        clearInterval(queueTimer);
        this.getGeocode();
      }, 500);
    }
  }

  handleFirstDataRendered(params) {
    //console.log("csv-grid handleFirstDataRendered.");
  }

  private getGeocode() {
    //console.log("csv-grid getGeocode.");

    if (this.geocodeRecords.length > 0) {
      let geocodeRecord = this.geocodeRecords.splice(0, 1);

      if (geocodeRecord.length > 0) {
        this.geocodeRecord = geocodeRecord[0];
        let address = "";

        // address or street provided
        if (this.columnTracking[6] !== -1) {
          address = (this.geocodeRecord[this.columnTracking[6]] || "");
        } else if (this.columnTracking[7] !== -1) {
          address = (this.geocodeRecord[this.columnTracking[7]] || "");
        }

        // city, state, zip, country provided
        if (this.columnTracking[8] !== -1) {
          address += "," + (this.geocodeRecord[this.columnTracking[8]] || "");
        }
        if (this.columnTracking[9] !== -1) {
          address += "," + (this.geocodeRecord[this.columnTracking[9]] || "");
        }
        if (this.columnTracking[10] !== -1) {
          address += " " + (this.geocodeRecord[this.columnTracking[10]] || "");
        }
        if (this.columnTracking[11] !== -1) {
          address += " " + (this.geocodeRecord[this.columnTracking[11]] || "");
        }

        // check if lat/lon are present; if yes - ignore record
        if (((this.geocodeRecord[this.columnTracking[1]] || "") !== "") &&
          ((this.geocodeRecord[this.columnTracking[2]] || "") !== "")) {
          let queueTimer = setTimeout(() => {
            clearInterval(queueTimer);
            this.getGeocode();
          }, 50);

          this.setQueryStatus("geocode query... (" + address + ") skipped.");
          return;
        } else {
          this.setQueryStatus("geocode query... (" + address + ")");
        }

        let urlMetadata: Observable<any>;
        let geocodeUrl = this.configService.configModel.Urls["geocoderUrl"] +
          "?f=json" +
          "&singleLine=" + encodeURIComponent(address) +
          "&outFields=" + encodeURIComponent("Match_addr,Addr_type");

        urlMetadata = this.http
          .get<any>(geocodeUrl, { responseType: 'json', withCredentials: true })
          .pipe(
            retryWhen(errors => errors.pipe(delay(2000), take(2))),
            catchError(this.handleError)/*, tap(console.log)*/);

        // handle error
        let urlMetadataSubscription = urlMetadata.subscribe(
          (response) => {
            if (response.hasOwnProperty("candidates")) {
              if (response.candidates.length > 0) {
                this.geocodeRecord[this.columnTracking[1]] = response.candidates[0].location.y;
                this.geocodeRecord[this.columnTracking[2]] = response.candidates[0].location.x;
                this.gridApi.redrawRows();
              }
            }
          },
          error => {
            let queueTimer = setTimeout(() => {
              clearInterval(queueTimer);
              this.getGeocode();
            }, 50);
          },
          () => {
            let queueTimer = setTimeout(() => {
              clearInterval(queueTimer);
              this.getGeocode();
            }, 50);
          });
      } else {
        this.setQueryStatus("", "reset");
      }
    } else {
      this.setQueryStatus("", "reset");
    }
  }

  private getLayerInfo() {
    //console.log("csv-grid getLayerInfo.");
    this.setQueryStatus("layer info query...");

    // clear current update indicator
    this.rowData.forEach((row) => {
      row["*UPD*"] = "";
    });
    this.gridApi.redrawRows();

    // split the url and extract the token (if provided)
    let urlArray = [] = this.parentLayer.url.split("?");
    this.layerBaseUrl = urlArray[0];

    // get referer
    let urlParser = new URL(this.layerBaseUrl);
    this.layerServiceUrl = urlParser.host;

    // get the token if available; else parse it
    this.layerToken = "";
    this.config.tokenServices.forEach((service) => {
      if ((service.serviceUrl !== undefined) && (service.serviceUrl !== null) &&
        (service.serviceUrl === this.layerServiceUrl)) {
        this.layerToken = service.token;
      }
    });

    // get token from params
    if (!this.layerToken) {
      let urlParamArray = [];
      if (urlArray.length > 1) {
        urlParamArray = urlArray[1].split("&");
        if (urlParamArray.length >= 1) {
          urlParamArray.forEach((value, index) => {
            if (value.startsWith("token=")) {
              this.layerToken = value.replace("&token=", "").replace("token=", "");
            }
          });
        }
      }
    }

    // get the layer definition
    let url = this.layerBaseUrl + "?" + "f=json";
    if ((this.layerToken !== undefined) && (this.layerToken !== null) && (this.layerToken !== "")) {
      url += "&token=" + this.layerToken;
    }
    let urlMetadata: Observable<any>;

    this.connectionFailure = true;
    if (!this.credentialsRequired) {
      this.credentialsRequired = this.configService.checkUrlAuthentication(url);
    }

    const headers = new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8');
    if (!this.credentialsRequired) {
      urlMetadata = this.http
        .get(url, { headers, responseType: 'text' })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError)/*, tap(console.log)*/);
    } else {
      urlMetadata = this.http
        .get(url, { headers, responseType: 'text', withCredentials: true })
        .pipe(
          retryWhen(errors => errors.pipe(delay(2000), take(2))),
          catchError(this.handleError)/*, tap(console.log)*/);
    }

    // handle error
    let urlMetadataSubscription = urlMetadata.subscribe(
      (response) => {
        this.connectionFailure = false;

        if (this.credentialsRequired) {
          this.configService.addUrlAuthentication(url);
        }

        let jsonResponse = JSON.parse(response);
        this.layerFields = jsonResponse.fields;
        this.layerAdvancedFeatures = jsonResponse.advancedQueryCapabilities;
        urlMetadataSubscription.unsubscribe();

        // check if layerFields have mmsi
        let mmsiFound = false;
        this.layerMMSIFieldName = "";
        this.layerCOURSEFieldName = "";
        this.layerBEARINGFieldName = "";
        this.layerSPEEDFieldName = "";
        this.layerFields.forEach((field) => {
          if (field.name.toLowerCase() === "mmsi") {
            mmsiFound = true;
            this.layerMMSIFieldName = field.name;
          } else if (field.name.toLowerCase() === "course") {
            this.layerCOURSEFieldName = field.name;
          } else if (field.name.toLowerCase() === "bearing") {
            this.layerBEARINGFieldName = field.name;
          } else if (field.name.toLowerCase() === "speed") {
            this.layerSPEEDFieldName = field.name;
          }
        });

        // retrieve the record count
        if (mmsiFound) {
          // https://developers.arcgis.com/rest/services-reference/query-map-service-layer-.htm
          let urlData = this.layerBaseUrl + "/query?" + "f=json" +
            "&where=1%3D1" +
            "&returnGeometry=false" +
            "&returnCountOnly=true";

          if ((this.layerToken !== undefined) && (this.layerToken !== null) && (this.layerToken !== "")) {
            urlData += "&token=" + this.layerToken;
          }
          let urlRecordCountdata: Observable<any>;

          if (!this.credentialsRequired) {
            urlRecordCountdata = this.http
              .get(urlData, { headers, responseType: 'text' })
              .pipe(
                retryWhen(errors => errors.pipe(delay(2000), take(2))),
                catchError(this.handleError)/*, tap(console.log)*/);
          } else {
            urlRecordCountdata = this.http
              .get(urlData, { headers, responseType: 'text', withCredentials: true })
              .pipe(
                retryWhen(errors => errors.pipe(delay(2000), take(2))),
                catchError(this.handleError)/*, tap(console.log)*/);
          }

          let urlRecordCountSubscription = urlRecordCountdata.subscribe(model => {
            urlRecordCountSubscription.unsubscribe();

            let jsonModel = JSON.parse(model);
            this.layerRecords = jsonModel.count;

            this.setQueryStatus("layer data query...");
            // split data in 20 records at a time
            this.mmsiListBatch = [];

            let listLength = this.mmsiList.length;
            let listBatchSize = Math.ceil(listLength / 15);
            let mmsiList = [...this.mmsiList];
            for (let i = 0; i < listBatchSize; i++) {
              this.mmsiListBatch.push(mmsiList.splice(0, 15));
            }

            this.mmsiListBatchIndex = 0;
            this.rowDataUpdate = [];
            this.retrieveLayerData();
          });
        } else {
          this.setQueryStatus("layer error/mmsi field not found");
          window.alert('OPS Track Widget: layer does not contain mmsi field for track match.\n' +
            this.layerBaseUrl);
        }
      },
      error => {
        console.log('HTTP Error', error);
        this.setQueryStatus("layer error/" + error, "error");
      },
      () => {
        if (!this.connectionFailure) {
          //console.log('HTTP request completed.');
          this.setQueryStatus("", "reset");
        } else if (!this.credentialsRequired) {
          this.credentialsRequired = true;
          this.getLayerInfo();
        } else {
          this.setQueryStatus("layer error (external)...", "error");
          window.alert('OPS Track Widget: HTTP other layer error; not trapped.\n' +
            this.layerBaseUrl);
        }
      });
  }

  private retrieveLayerData() {
    //console.log("csv-grid retrieveLayerData.");
    this.setQueryStatus("data query... (" + this.mmsiListBatchIndex + " of " + this.mmsiListBatch.length + ")");

    if (this.mmsiListBatchIndex < this.mmsiListBatch.length) {
      // https://developers.arcgis.com/rest/services-reference/query-map-service-layer-.htm
      let url = this.layerBaseUrl + "/query?" + "f=json" +
        "&returnGeometry=true" +
        "&returnQueryGeometry=true" +
        "&returnExceededLimitFeatures=true" +
        "&outFields=*" +
        //"&orderByFields=" + this.layerIDField +
        //"&resultOffset=" + this.layerOffset +
        //"&resultRecordCount=" + this.layerMaxRecords +
        "&outSR=4326";

      // add field filters if required
      let batch = this.mmsiListBatch[this.mmsiListBatchIndex];
      this.mmsiListBatchIndex++;

      url += "&where=" + this.layerMMSIFieldName + "+IN+" +
        encodeURIComponent("(" + batch.join(",") + ")");

      if ((this.layerToken !== undefined) && (this.layerToken !== null) && (this.layerToken !== "")) {
        url += "&token=" + this.layerToken;
      }
      let urlRecorddata: Observable<any>;

      this.connectionFailure = true;
      if (!this.credentialsRequired) {
        this.credentialsRequired = this.configService.checkUrlAuthentication(url);
      }

      const headers = new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8');
      if (!this.credentialsRequired) {
        urlRecorddata = this.http
          .get(url, { headers, responseType: 'text' })
          .pipe(
            retryWhen(errors => errors.pipe(delay(2000), take(2))),
            catchError(this.handleError)/*, tap(console.log)*/);
      } else {
        urlRecorddata = this.http
          .get(url, { headers, responseType: 'text', withCredentials: true })
          .pipe(
            retryWhen(errors => errors.pipe(delay(2000), take(2))),
            catchError(this.handleError)/*, tap(console.log)*/);
      }

      let urlRecordSubscription = urlRecorddata.subscribe((model) => {
        urlRecordSubscription.unsubscribe();

        this.connectionFailure = false;
        this.setQueryStatus("data received, processing...");

        // send notification to parent that partial result was returned
        let jsonModel = JSON.parse(model);
        if (jsonModel.features) {
          let recordCount = jsonModel.features.length;

          window.setTimeout(() => {
            this.retrieveLayerData();
          }, 50);

          // update the grid data
          let index = 0;
          jsonModel.features.forEach((feature) => {
            index = this.mmsiList.indexOf("'" + feature.attributes[this.layerMMSIFieldName] + "'");

            if (index !== -1) {
              this.rowData[index][this.columnTracking[1]] = feature.geometry.y;
              this.rowData[index][this.columnTracking[2]] = feature.geometry.x;
              this.rowData[index]["*UPD*"] = "Y";

              // update course, bearing, speed if needed and exist
              if ((this.columnTracking[3] !== -1) && (this.layerCOURSEFieldName !== "")) {
                this.rowData[index][this.columnTracking[3]] = feature.attributes[this.layerCOURSEFieldName];
              }
              if ((this.columnTracking[4] !== -1) && (this.layerBEARINGFieldName !== "")) {
                this.rowData[index][this.columnTracking[4]] = feature.attributes[this.layerBEARINGFieldName];
              }
              if ((this.columnTracking[5] !== -1) && (this.layerSPEEDFieldName !== "")) {
                this.rowData[index][this.columnTracking[5]] = feature.attributes[this.layerSPEEDFieldName];
              }

              this.rowDataUpdate.push(this.rowData[index]);
            }
          });
        } else {
          this.setQueryStatus("data received, error... /code-" + jsonModel.error.code + "/" + jsonModel.error.message, "error");
          window.alert("error retrieving data: code-" + jsonModel.error.code + "/" + jsonModel.error.message);
        }
      },
        error => {
          console.log('HTTP Error', error);
          this.setQueryStatus("data query, error/" + error, "error");
        },
        () => {
          if (!this.connectionFailure) {
            //console.log('HTTP request completed.');
            this.setQueryStatus("", "reset");
          } else if (!this.credentialsRequired) {
            this.credentialsRequired = true;
            this.getLayerInfo();
          } else {
            this.setQueryStatus("data query error (external)...", "error");
            window.alert('OPS Tracks Widget: HTTP other layer error; not trapped.\n' +
              this.layerBaseUrl);
          }
        });
    } else {
      this.agGrid.api.applyTransaction({ update: this.rowDataUpdate });
      this.rowDataUpdate = [];
      this.setQueryStatus("", "reset");
    }
  }

  private updateGridData(filterText?: string) {
    //console.log("csv-grid updateGridData.");
    this.rowData = [];
    this.mmsiList = [];

    if ((filterText !== null) && (filterText !== undefined)) {
      filterText = filterText.toLowerCase();
    }

    let records = [];
    let record = {};
    let index = 0, validRecord = false;
    let columnValue = "";
    let coordinates = "";
    let count = 0;
    this.parentData.forEach((value) => {
      if (value) {
        record = {};
        index = 0;

        if ((filterText !== null) && (filterText !== undefined)) {
          if (columnValue.toLowerCase().includes(filterText)) {
            validRecord = true;
          }
        } else {
          validRecord = true;
        }

        this.rowHeaders.forEach((header) => {
          record[header] = value[index++];

          if (header.toLowerCase() === "mmsi") {
            this.mmsiList.push("'" + record[header] + "'");
          } else
            // convert lat/lon if needed
            if ((this.columnTracking[1] !== this.columnTracking[2]) &&
              ((header === this.columnTracking[1]) || (header === this.columnTracking[2]))) {
              coordinates = record[header] + "";
              count = this.jsutils.countChars(coordinates, " ");

              // dms to dd conversion when 2, DMM when 1
              if (count === 2) {
                record[header] = this.jsutils.convertDMSDD(coordinates);
              } else if (count === 1) {
                record[header] = this.jsutils.convertDDMDD(coordinates);
              }

            }
        });

        if (validRecord) {
          records.push(record);

          // if geocoding and record header = "geocodeAddress"
          if (this.parentGeocode) {
            this.geocodeRecords.push(record);
          }
        }
      }
    });

    this.rowData = records;
    //this.agGrid.api.setRowData(this.rowData);

    if (this.parentRestoreState) {
      this.parentRestoreState = false;
      this.restoreState();
    }
  }

  paginationNumberFormatter(params) {
    //console.log("csv-grid paginationNumberFormatter.");
    return "[" + params.value.toLocaleString() + "]";
  }

  handleRowClicked($event) {
    //console.log("csv-grid handleRowClicked.");
    this.selectedNodesCache.push($event.node);
    this.gridApi.redrawRows({ rowNodes: this.selectedNodesCache });
    this.selectedNodesCache = this.gridApi.getSelectedNodes();

    this.recordsSelected = 0;
    if ((this.columnTracking[0] === -1) ||
      (this.columnTracking[1] === -1) || (this.columnTracking[2] === -1)) {
    } else {
      let selectedRows = this.gridApi.getSelectedRows();

      let tracks;
      if (selectedRows.length > 0) {
        tracks = selectedRows;
        this.recordsSelected = selectedRows.length;
        this.notificationService.publisherAction({ action: 'CSV SELECTED COUNT', value: this.recordsSelected });

        this.plotMarker(tracks, false, true);
      }
    }
  }

  plotMarker(selectedRows, share, temporary) {
    //console.log("csv-grid plotMarker.");
    let overlayId = "";
    if (temporary === true) {
      overlayId = "CSVTMP-Viewer";
    } else {
      overlayId = "CSV-Viewer";
    }

    this.owfapi.sendChannelRequest('map.overlay.remove', { 'overlayId': 'CSVTMP-Viewer' });

    this.worker.postMessage({
      overlayId: overlayId,
      filename: this.parentFileName,
      tracks: selectedRows,
      showLabels: this.parentLabels, color: this.parentColor,
      columnTracking: this.columnTracking,
      mmsiEnabled: (this.layerMMSIFieldName !== ""),
      baseUrl: this.configService.getBaseHref(),
      saveToCatalog: share,
      showZoom: this.parentZoom, mapId: this.parentMapId
    });

    if (temporary === true) {
      window.setTimeout(() => {
        if (selectedRows.length === 1) {
          this.owfapi.sendChannelRequest("map.feature.unplot", {
            overlayId: overlayId,
            featureId: (this.parentFileName + "_" + selectedRows[0][this.columnTracking[0]]).replace(/ /gi, "_")
          });
        } else {
          this.owfapi.sendChannelRequest("map.feature.unplot", {
            overlayId: overlayId,
            featureId: (this.parentFileName + "_Collection")
          });
        }
      }, 10000);
    }
  }

  handleExportClick($event) {
    //console.log("csv-grid handleExportClick.");
    let selectedRows = this.gridApi.getSelectedRows();

    let params = {
      allColumns: true,
      onlySelected: false,
      onlySelectedAllPages: false
    }

    if (selectedRows.length > 0) {
      params.onlySelected = true;
      params.onlySelectedAllPages = true;
    }

    this.gridApi.exportDataAsCsv(params);
  }

  saveState($event?) {
    //console.log("csv-grid saveState.");

    console.log($event);
    // https://blog.ag-grid.com/persisting-ag-grid-state-with-react-redux/
    let options = {
      id: this.parentId,
      name: this.parentName,
      type: "CSV",
      geocode: this.parentGeocode,
      layer: this.parentLayer,
      search: this.parentSearch,
      color: this.parentColor,
      isLabel: this.parentLabels,
      isZoom: this.parentZoom,
      mapId: this.parentMapId,
      data: this.parentData,
      layers: this.parentLayers,
      filename: this.parentFileName,
      grid: {
        columnState: this.gridColumnApi.getColumnState(),
        // groupState: this.gridOptions.columnApi.getColumnGroupState(),
        // sortModel: this.gridOptions.api.getSortModel(),
        // filterModel: this.gridOptions.api.getFilterModel(),
        pageNumber: this.gridApi.paginationGetCurrentPage()
      }
    };

    this.configService.setMemoryValue(this.parentId, options);
  }

  private restoreState() {
    //console.log("csv-grid restoreState.");

    let options = this.configService.getMemoryValue(this.parentId);

    if (options) {
      this.gridOptions.suppressColumnStateEvents = true;

      this.gridColumnApi.applyColumnState({ state: options.grid.columnState });
      // this.gridOptions.columnApi.setColumnGroupState(options.grid.groupState);
      // this.gridOptions.api.setSortModel(options.grid.sortModel);
      // this.gridOptions.api.setFilterModel(options.grid.filterModel);
      this.gridApi.paginationGoToPage(options.grid.pageNumber);

      this.gridOptions.suppressColumnStateEvents = false;
    }
  }

  setQueryStatus(message, status?) {
    //console.log("csv-grid setQueryStatus.");
    let resetMessage = "please wait, ";
    if ((status !== undefined) && (status !== null)) {
      if (status === "error") {
        this.queryStatusMessage = resetMessage + " /" + message;
        this.divQueryStatusCss.display = "table-cell";
        this.divQueryStatusCss["background-color"] = "red";
        this.divQueryStatusCss.color = "white";
      } else if (status === "reset") {
        this.divQueryStatusCss.display = "none";
        this.divQueryStatusCss["background-color"] = "gold";
        this.divQueryStatusCss.color = "black";
      }
    } else {
      this.queryStatusMessage = resetMessage + " /" + message;
      this.divQueryStatusCss.display = "table-cell";
      this.divQueryStatusCss["background-color"] = "gold";
      this.divQueryStatusCss.color = "black";
    }
  }

  private handleError(error: HttpErrorResponse) {
    //console.log("csv-grid handleError.");
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