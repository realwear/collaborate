import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AzureSignInDialogComponent } from './azure-sign-in-dialog.component';
import { DeviceCodeService } from '../device-code.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TalkerService } from '@rw/speech';

class MockTalker {
  reset = jest.fn();
  speakNext = jest.fn();
}

describe('AzureSignInDialogComponent', () => {
  let component: AzureSignInDialogComponent;
  let fixture: ComponentFixture<AzureSignInDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatProgressSpinnerModule
      ],
      providers: [
        {
          provide: DeviceCodeService,
          useValue: { }
        },
        {
          provide: TalkerService,
          useClass: MockTalker
        }
      ],
      declarations: [
        AzureSignInDialogComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AzureSignInDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
