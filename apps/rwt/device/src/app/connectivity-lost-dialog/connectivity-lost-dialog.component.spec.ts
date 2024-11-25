import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectivityLostDialogComponent } from './connectivity-lost-dialog.component';

describe('ConnectivityLostDialogComponent', () => {
  let component: ConnectivityLostDialogComponent;
  let fixture: ComponentFixture<ConnectivityLostDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectivityLostDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectivityLostDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
