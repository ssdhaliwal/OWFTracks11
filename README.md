# OWFTracks11

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.7.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## packaging for tomcat
ng build -- --base-href=/OWFTracks-1.0.0/
cd dist/OWFTracks
zip -r OWFTracks-1.0.0.war *
mv OWFTracks-1.0.0.war /tomcat/webapps/

===============================================================================================

## FIX for version 7 

ERROR in node_modules/primeng/api/megamenuitem.d.ts(1,10): error TS2305: Module '"E:/home/development/opt/angular/OWFTracks/node_modules/@angular/router/router"' has no exported member 'QueryParamsHandling'.
node_modules/primeng/api/menuitem.d.ts(1,10): error TS2305: Module '"E:/home/development/opt/angular/OWFTracks/node_modules/@angular/router/router"' has no exported member 'QueryParamsHandling'.

import { QueryParamsHandling } from '@angular/router/src/config';
===============================================================================================

- check node and npm
node --version
v12.18.4

npm --version
6.14.6

- update/install angular cli
npm install -g @angular/cli
> @angular/cli@11.0.7

- create new project
ng new OWFTracks11
strict - y
routing - y
CSS

cd OWFTracks11
ng server --open

- create local certificate
mkdir certs
cd certs

>file:localhost.cnf<
[req]
default_bits = 2048
prompt = no
default_md = sha256
x509_extensions = v3_req
distinguished_name = dn
[dn]
C = GB
ST = London
L = London
O = My Organisation
OU = My Organisational Unit
emailAddress = email@domain.com
CN = localhost
[v3_req]
subjectAltName = @alt_names
[alt_names]
DNS.1 = localhost

[D:\PROGRAMS\Vagrant\embedded\mingw64\bin]
D:\PROGRAMS\Vagrant\embedded\mingw64\bin\openssl req -new -x509 -newkey rsa:2048 -sha256 -nodes -keyout localhost.key -days 3560 -out localhost.crt -config localhost.cnf

>file:localhost.key<
>file:localhost.crt<

- update the package.json to use the certs
"start": "ng serve --ssl --ssl-key d:\\certificates\\localhost.key  --ssl-cert d:\\certificates\localhost.crt"

npm run start

ng add @angular/material

>update the routes<
ng g component components/page-not-found
ng g component components/growler

- add the components to app.module.ts
-- update the declarations in app.module.ts

- add the components to app-routing.module.ts

>add shared service module<
ng g module modules/shared-services --flat

>add HttpClientModule to the app.module<

>add notification service<
ng g service service/action-notification

>add config model and service <
ng g class models/config --type=model
ng g service service/config

>add lodash, underscore, and crypto-js<
npm install --save lodash
npm install --save @types/lodash

npm install --save underscore
npm install --save @types/underscore

npm install --save crypto-js
npm install --save @types/crypto-js
>change strict to false in tsconfig.json<

>update shared-services<

>update app component<

>fix menu with/options - dynamic<
ng g class models/menu --type=model
ng g component components/menu-child

https://juristr.com/blog/2017/07/ng2-dynamic-tab-component/
https://jtblin.github.io/angular-chart.js/
