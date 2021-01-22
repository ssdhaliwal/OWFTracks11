import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-growler',
  templateUrl: './growler.component.html',
  styleUrls: ['./growler.component.css']
})
export class GrowlerComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute) {
		//console.log("GrowlerComponent constructor.");

   }

  ngOnInit(): void {
		//console.log("GrowlerComponent ngOnInit.");

    this.route.params.subscribe(params => {
      console.log(".. GrowlerComponent/ ", params);
    });
  }

  ngOnDestroy(): void {
    //console.log("GrowlerComponent ngOnDestroy.");
    
  }

}
