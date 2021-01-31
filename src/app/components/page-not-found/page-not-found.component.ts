import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Observer, of, Subject, EMPTY, Subscription, interval, empty, throwError } from 'rxjs';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.css']
})
export class PageNotFoundComponent implements OnInit, OnDestroy {
  description: string = '';
  routeSubscription: Subscription;

  constructor(private route: ActivatedRoute, private router: Router) { 
    //console.log("PageNotFoundComponent constructor.");
    console.log("PageNotFoundComponent created...");
  }

  ngOnInit(): void {
		//console.log("PageNotFoundComponent ngOnInit.");

    this.route.params.subscribe(payload => {
      // console.log(`${payload.action}/${payload.value}, received by PageNotFoundComponent`);
    });
  }

  ngOnDestroy(): void {
    //console.log("PageNotFoundComponent ngOnDestroy.");
    
    this.routeSubscription.unsubscribe();
  }

}
