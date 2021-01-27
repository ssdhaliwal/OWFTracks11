import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-growler',
  templateUrl: './growler.component.html',
  styleUrls: ['./growler.component.css']
})
export class GrowlerComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute,
    private _snackBar: MatSnackBar) {
    //console.log("GrowlerComponent constructor.");

  }

  ngOnInit(): void {
    //console.log("GrowlerComponent ngOnInit.");

    this.route.params.subscribe(params => {
      this.openSnackBar(params.message, params.severity);
    });
  }

  ngOnDestroy(): void {
    //console.log("GrowlerComponent ngOnDestroy.");

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
