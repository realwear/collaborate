import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IncomingMeetingDialogComponent } from './incoming-meeting-dialog.component';

describe('IncomingMeetingDialogComponent', () => {
  let component: IncomingMeetingDialogComponent;
  let fixture: ComponentFixture<IncomingMeetingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IncomingMeetingDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IncomingMeetingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
