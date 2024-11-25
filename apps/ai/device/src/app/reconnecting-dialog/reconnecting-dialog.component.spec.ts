import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReconnectingDialogComponent } from './reconnecting-dialog.component';

describe('ReconnectingDialogComponent', () => {
  let component: ReconnectingDialogComponent;
  let fixture: ComponentFixture<ReconnectingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReconnectingDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReconnectingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
