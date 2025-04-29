import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardHeaderComponent } from './dashboard-header.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('DashboardHeaderComponent', () => {
  let component: DashboardHeaderComponent;
  let fixture: ComponentFixture<DashboardHeaderComponent>;
  let debugElement: DebugElement;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardHeaderComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardHeaderComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the main container with the correct class', () => {
    const container = nativeElement.querySelector('.dashboard-header-container');
    expect(container).toBeTruthy();
  });

  it('should contain the logo with the correct text and styling', () => {
    const logo = nativeElement.querySelector('.logo');
    expect(logo).toBeTruthy();
    expect(logo?.querySelector('.hogar-part')?.textContent).toContain('Hogar');
    expect(logo?.querySelector('.tres-sesenta-part')?.textContent).toContain(' 360');
  });

  it('should contain the user info section', () => {
    const userInfo = nativeElement.querySelector('.user-info');
    expect(userInfo).toBeTruthy();
  });

  it('should contain the welcome message with the correct text', () => {
    const welcomeMessage = nativeElement.querySelector('.welcome-message');
    expect(welcomeMessage).toBeTruthy();
    expect(welcomeMessage?.textContent).toContain('Bienvenido, Admin');
  });

  it('should contain the user icon', () => {
    const userIcon = nativeElement.querySelector('.user-icon');
    expect(userIcon).toBeTruthy();
    expect(userIcon?.querySelector('svg')).toBeTruthy();
  });
});
