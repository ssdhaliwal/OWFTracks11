import { Injectable } from '@angular/core';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError, forkJoin } from 'rxjs';
import { catchError, map, filter, startWith, switchMap, tap, retry, retryWhen, delay, take } from 'rxjs/operators';

import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';

import * as _ from 'lodash';
import * as CryptoJS from 'crypto-js';

import { ActionNotificationService } from '../service/action-notification.service';
import { ConfigModel, UrlAuthRequired } from '../models/config.model';

const httpOptions = {
	headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
	providedIn: 'root',
})
export class ConfigService {
	configObservable: Observable<ConfigModel>;
	configModel: ConfigModel;
	urlAuthorization = [];
	private baseUrl = 'assets/config.json';
	private baseHref = '';

	memoryPersistence = {};

	constructor(private http: HttpClient,
		private notificationService: ActionNotificationService) {
		this.retrieveConfig();
	}

	private retrieveConfig(): void {
		this.configObservable = this.http
			.get<any>(this.baseUrl, { responseType: 'json', withCredentials: true })
			.pipe(
				catchError(this.handleError('retrieveConfig', []))/*, tap(console.log)*/);

		this.configObservable.subscribe(model => {
			this.configModel = model;

			// if there are urls in token referer we need to retrieve and store them
			let responseList = [];
			let responseCalls: Observable<any>[] = [];
			this.configModel.tokenServices.forEach((item) => {
				if ((item.url !== undefined) && (item.url !== null)) {
					responseList.push(item.url);
					responseCalls.push(this.http.get<any>(item.url, { responseType: 'json', withCredentials: true })
						.pipe(
							catchError(this.handleError('retrieveConfig', []))/*, tap(console.log)*/));
				}
			});

			this.notificationService.publisherAction({ action: 'CONFIG READY', value: "" });

			// make sure all are done and then return the results
			let servicesObservable: Observable<any[]> = forkJoin(responseCalls);
			let serviceSubscription = servicesObservable.subscribe((serviceArray) => {
				serviceSubscription.unsubscribe();

				// store the referer and remove the urls
				let found = false;
				serviceArray.forEach((service) => {
					if ((service.serviceUrl !== undefined) && (service.refserviceUrlerer !== null)) {
						this.configModel.tokenServices.forEach((value) => {
							if (value.serviceUrl === service.serviceUrl) {
								value.token = service.token;
								found = true;
							}
						});

						if (!found) {
							this.configModel.tokenServices.push({
								"url": "",
								"serviceUrl": service.serviceUrl,
								"token": service.token
							});
						}
					}
				});
			});
		});
	}

	getConfig() {
		return this.configModel;
	}

	getBaseHref() {
		return this.configModel.Urls["baseUrl"] + "-" + this.configModel.version;
	}

	getMemoryValue(key) {
		return this.memoryPersistence[key];
	}

	removeMemoryValue(key) {
		delete this.memoryPersistence[key];
	}

	setMemoryValue(key, value) {
		this.memoryPersistence[key] = value;
	}

	addUrlAuthentication(key) {
		if (!this.checkUrlAuthentication(key)) {
			this.urlAuthorization.push(key);
		}
	}

	checkUrlAuthentication(key) {
		if (this.urlAuthorization.indexOf(key) >= 0) {
			return true;
		} else {
			return false;
		}
	}

	encryptString(keys, value) {
		let result = CryptoJS.AES.encrypt(value.trim(), keys.trim()).toString();
		return result;
	}

	decryptString(keys, value) {
		let result = CryptoJS.AES.decrypt(value.trim(), keys.trim()).toString(CryptoJS.enc.Utf8);
		return result;
	}

	getResourceFile(fileurl): Observable<any> {
		const httpOptions = {
			headers: new HttpHeaders({
				'Content-Type': 'application/json'
			}),
			observe: 'response' as 'body',
			withCredentials: true
		};

		let tracks = this.http
			.get<any>(fileurl, httpOptions)
			.pipe(
				tap(res => { this.processResponse(res); }),
				catchError(this.handleError('getCotTracks', [])));

		return tracks;
	}

	private processResponse(response) {
		// console.log(response.headers, response.status, response.type);
	}

	private handleError<T>(operation = 'operation', result?: T) {
		return (error: any): Observable<T> => {

			// TODO: send the error to remote logging infrastructure
			console.error(error); // log to console instead

			// Let the app keep running by returning an empty result.
			return of(result as T);
		};
	}
}