import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-growler',
  templateUrl: './growler.component.html',
  styleUrls: ['./growler.component.css']
})
export class GrowlerComponent implements OnInit {

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log(".. GrowlerComponent/ ", params);
    });
  }

}
