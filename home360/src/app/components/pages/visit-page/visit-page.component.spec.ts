import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitPageComponent } from './visit-page.component';

describe('VisitPageComponent', () => {
  let component: VisitPageComponent;
  let fixture: ComponentFixture<VisitPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [VisitPageComponent]
    });
    fixture = TestBed.createComponent(VisitPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
