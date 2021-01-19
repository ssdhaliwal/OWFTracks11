export class ConfigModel {
	version: string;
	buildDate: string;
	stateVersion: string;
	mapInterface: MapInterface;
	directories: any[] | null;
	layerParam: any;
	Urls: Urls[] | null;
	tokenServices: TokenServices[] | null;
	roles: string[] | null;
	aisvtsServices: AISVTSServices;
	sensors: Sensors[];

	constructor(version: string, buildDate: string, stateVersion: string,
		mapInterface: MapInterface, directories: any[],
		layerParam: any, Urls: Urls[],
		tokenServices: TokenServices[], roles: string[],
		aisvtsServices: AISVTSServices, sensors: Sensors[]) {
		this.version = version;
		this.buildDate = buildDate;
		this.stateVersion = stateVersion;
		this.mapInterface = mapInterface;
		this.directories = directories;

		this.layerParam = layerParam;

		this.Urls = Urls;
		this.tokenServices = tokenServices;
		this.roles = roles;

        this.aisvtsServices = aisvtsServices;
        this.sensors = sensors;
	}
}

export class MapInterface {
	onPlot: boolean = false;
	onViewChange: boolean = false;
	filter: any = {
		area: "single"
	}

	constructor(onPlot: boolean, onViewChange: boolean, filter: any) {
		this.onPlot = onPlot;
		this.onViewChange = onViewChange;
		this.filter = filter;
	}
}

export class Urls {
	service: string;
	url: string;

	constructor(service: string, url: string) {
		this.service = service;
		this.url = url;
	}
}

export class TokenServices {
	url: string;
	serviceUrl: string;
	token: string;

	constructor(url: string, serviceUrl: string, token: string) {
		this.url = url;
		this.serviceUrl = serviceUrl;
		this.token = token;
	}
}

export class UrlAuthRequired {
	url: string;
	authRequired: boolean;

	constructor(url: string, authRequired: boolean) {
		this.url = url;
		this.authRequired = authRequired;
	}
}

export class AISVTSPosition {
	lat: number;
	lon: number;

	constructor(lat: number, lon: number) {
		this.lat = lat;
		this.lon = lon;
	}
}

export class AISVTSConnection {
	name: string;
	url: string;
	position: AISVTSPosition;
	roles: string[];
	uuid: string = "";

	constructor(name: string, url: string, position: AISVTSPosition, roles: string[]) {
		this.name = name;
		this.url = url;
		this.position = position;
		this.roles = roles;
	}
}

export class AISVTSServices {
	roles: string[];
	connections: AISVTSConnection[];

	constructor(roles: string[], connections: AISVTSConnection[]) {
		this.roles = roles;
		this.connections = connections;
	}
}

export class Sensors {
	name: string = "";
	url: string = "";
	token: string = "";
	uuid: string = "";
}