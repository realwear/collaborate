import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebviewInstallerComponent } from './webview-installer.component';

describe('WebviewInstallerComponent', () => {
  let component: WebviewInstallerComponent;
  let fixture: ComponentFixture<WebviewInstallerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebviewInstallerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WebviewInstallerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
