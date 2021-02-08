import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShapeCoreComponent } from './shape-core.component';

describe('ShapeCoreComponent', () => {
  let component: ShapeCoreComponent;
  let fixture: ComponentFixture<ShapeCoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShapeCoreComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShapeCoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
