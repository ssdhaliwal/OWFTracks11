import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeGridComponent } from './shape-grid.component';

describe('ShapeGridComponent', () => {
  let component: ShapeGridComponent;
  let fixture: ComponentFixture<ShapeGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShapeGridComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
