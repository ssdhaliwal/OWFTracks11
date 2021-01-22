import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.css']
})
export class PageNotFoundComponent implements OnInit, OnDestroy {
  description: string = '';
  
  constructor(private route: ActivatedRoute, private router: Router) { 
		//console.log("PageNotFoundComponent constructor.");
  }

  ngOnInit(): void {
		//console.log("PageNotFoundComponent ngOnInit.");

    this.route.params.subscribe(params => {
      console.log(".. PageNotFoundComponent/ ", params);
    });
  }

  ngOnDestroy(): void {
		//console.log("PageNotFoundComponent ngOnDestroy.");
  }

}
