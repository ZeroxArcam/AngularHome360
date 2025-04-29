import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardFooterComponent } from './dashboard-footer.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('DashboardFooterComponent', () => {
  let component: DashboardFooterComponent;
  let fixture: ComponentFixture<DashboardFooterComponent>;
  let debugElement: DebugElement;
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardFooterComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardFooterComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain the main container with the correct class', () => {
    const container = nativeElement.querySelector('.dashboard-footer-container');
    expect(container).toBeTruthy();
  });

  it('should contain the "Hogar360" section with the correct text', () => {
    const section = nativeElement.querySelector('.hogar360-section');
    expect(section).toBeTruthy();
    expect(section?.querySelector('h3')?.textContent).toContain('Hogar360');
    expect(section?.querySelector('p')?.textContent).toContain('Tu partner en la búsqueda del espacio perfecto.');
  });

  it('should contain the "Acceso rápido" section with the correct links', () => {
    const section = nativeElement.querySelector('.acceso-rapido-section');
    expect(section).toBeTruthy();
    expect(section?.querySelector('h3')?.textContent).toContain('Acceso rápido');
    const links = section?.querySelectorAll('ul li a');
    expect(links?.length).toBe(3);
    expect(links?.[0]?.textContent).toContain('Buscar Propiedades');
    expect(links?.[1]?.textContent).toContain('Publica tu propiedad');
    expect(links?.[2]?.textContent).toContain('Property Management');
  });

  it('should contain the "Contactanos" section with the correct information', () => {
    const section = nativeElement.querySelector('.contactanos-section');
    expect(section).toBeTruthy();
    expect(section?.querySelector('h3')?.textContent).toContain('Contactanos');
    const paragraphs = section?.querySelectorAll('p');
    expect(paragraphs?.length).toBe(3);
    expect(paragraphs?.[0]?.textContent).toContain('1-800-HOGAR360');
    expect(paragraphs?.[1]?.textContent).toContain('info@hogar360.com');
    expect(paragraphs?.[2]?.textContent).toContain('123 Real Estate Ave');
  });

  it('should contain the "Síguenos" section with social media links', () => {
    const section = nativeElement.querySelector('.siguenos-section');
    expect(section).toBeTruthy();
    expect(section?.querySelector('h3')?.textContent).toContain('Síguenos');
    const socialLinks = section?.querySelector('.social-links')?.querySelectorAll('a');
    expect(socialLinks?.length).toBe(4);
  });

  it('should contain the copyright section with the correct text', () => {
    const copyrightSection = nativeElement.querySelector('.copyright');
    expect(copyrightSection).toBeTruthy();
    expect(copyrightSection?.querySelector('p')?.textContent).toContain('© 2025 Hogar360. All rights reserved.');
  });
});
