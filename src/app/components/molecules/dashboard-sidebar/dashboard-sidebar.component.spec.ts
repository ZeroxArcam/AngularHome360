import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardSidebarComponent } from './dashboard-sidebar.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

describe('DashboardSidebarComponent', () => {
  let component: DashboardSidebarComponent;
  let fixture: ComponentFixture<DashboardSidebarComponent>;
  let debugElement: DebugElement;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardSidebarComponent],
      imports: [RouterTestingModule],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardSidebarComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the main container with the correct class', () => {
    const container = nativeElement.querySelector('.dashboard-sidebar-container');
    expect(container).toBeTruthy();
  });

  it('should contain a navigation list with the correct class', () => {
    const navList = nativeElement.querySelector('.nav-list');
    expect(navList).toBeTruthy();
    expect(navList?.querySelectorAll('.nav-item').length).toBe(5);
  });

  it('should have the first link to "/admin/dashboard" with "Dashboard" text', () => {
    const firstItem = nativeElement.querySelector('.nav-item:nth-child(1) a');
    expect(firstItem).toBeTruthy();
    expect(firstItem?.getAttribute('routerLink')).toBe('/admin/dashboard');
    expect(firstItem?.querySelector('span')?.textContent).toContain('Dashboard');
    expect(firstItem?.querySelector('i')?.classList).toContain('fa-chart-line');
  });

  it('should have the second link to "/admin/categories/create" with "Categorías" text', () => {
    const secondItem = nativeElement.querySelector('.nav-item:nth-child(2) a');
    expect(secondItem).toBeTruthy();
    expect(secondItem?.getAttribute('routerLink')).toBe('/admin/categories/create');
    expect(secondItem?.querySelector('span')?.textContent).toContain('Categorías');
    expect(secondItem?.querySelector('i')?.classList).toContain('fa-tags');
  });

  it('should have the third link with "#" and "Propiedades" text', () => {
    const thirdItem = nativeElement.querySelector('.nav-item:nth-child(3) a');
    expect(thirdItem).toBeTruthy();
    expect(thirdItem?.getAttribute('href')).toBe('#');
    expect(thirdItem?.querySelector('span')?.textContent).toContain('Propiedades');
    expect(thirdItem?.querySelector('i')?.classList).toContain('fa-home');
  });

  it('should have the fourth link with "#" and "Usuarios" text', () => {
    const fourthItem = nativeElement.querySelector('.nav-item:nth-child(4) a');
    expect(fourthItem).toBeTruthy();
    expect(fourthItem?.getAttribute('href')).toBe('#');
    expect(fourthItem?.querySelector('span')?.textContent).toContain('Usuarios');
    expect(fourthItem?.querySelector('i')?.classList).toContain('fa-users');
  });

  it('should have the fifth link with "#" and "Configuración" text', () => {
    const fifthItem = nativeElement.querySelector('.nav-item:nth-child(5) a');
    expect(fifthItem).toBeTruthy();
    expect(fifthItem?.getAttribute('href')).toBe('#');
    expect(fifthItem?.querySelector('span')?.textContent).toContain('Configuración');
    expect(fifthItem?.querySelector('i')?.classList).toContain('fa-cog');
  });
});
