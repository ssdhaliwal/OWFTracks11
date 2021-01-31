import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError } from 'rxjs';

import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-growler',
  templateUrl: './growler.component.html',
  styleUrls: ['./growler.component.css']
})
export class GrowlerComponent implements OnInit, OnDestroy {
  routeSubscription: Subscription;

  constructor(private route: ActivatedRoute,
    private _snackBar: MatSnackBar) {
    //console.log("GrowlerComponent constructor.");

  }

  ngOnInit(): void {
    //console.log("GrowlerComponent ngOnInit.");

    this.routeSubscription = this.route.paramMap.subscribe(params => {
      this.openSnackBar(params.get('message'), params.get('severity'));
    });
  }

  ngOnDestroy(): void {
    //console.log("GrowlerComponent ngOnDestroy.");

    this.routeSubscription.unsubscribe();
  }

  openSnackBar(message: string, action: string) {
    let cssClass = 'white-snackbar';

    // update cssClass based on action
    if (action.toUpperCase() === "CRITICAL") {
      cssClass = 'red-snackbar';
    } else if (action.toUpperCase() === "WARNING") {
      cssClass = 'orange-snackbar';
    } else if (action.toUpperCase() === "NOTICE") {
      cssClass = 'blue-snackbar';
    } else if (action.toUpperCase() === "SUCCESS") {
      cssClass = 'green-snackbar';
    } else if (action.toUpperCase() === "INFO") {
      cssClass = 'white-snackbar';
    }

    this._snackBar.open(message, action, {
      panelClass: [cssClass],
      horizontalPosition: 'right',
      verticalPosition: 'bottom'
    });
  }
}
