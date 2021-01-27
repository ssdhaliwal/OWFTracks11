import { GridOptions } from "ag-grid-community";

export class GisQueryModel {
    baseUrl: String = "";
    serviceUrl: String = "";
    token: String = "";
    connectionFailure: boolean = false;
    credentialsRequired: boolean = false;
    fields: any = null;
    advancedQueryCapabilities: any = null;
    recordCount: number = 0;
    recordCountRetrieve: number = 0;
    errorMessage: any = null;
    error: boolean = false;
    columnDefinitions: any = [];
    columnList: any = {};
    titleField: String = "";
    idField: String = "";
    dndCapability: boolean = false;
    gridOptions: GridOptions;
    gridApi: any;
    gridColumnApi: any;
    searchField: any;
    searchValue: any;
    mapView: any;
    rawFeatures: any[] = [];
    data: any[] = [];
    geometryType: "esriGeometryPoint";
    geometryData: any = {};
    graphicsArray: any[] = [];
    
    constructor(baseUrl:String, serviceUrl:String, token:String) {
        this.baseUrl = baseUrl;
        this.serviceUrl = serviceUrl;
        this.token = token;
	}
}
