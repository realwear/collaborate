import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotifyDialogComponent } from './notify-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { UxlibModule } from '../uxlib.module';

describe('NotifyDialogComponent', () => {
  let component: NotifyDialogComponent;
  let fixture: ComponentFixture<NotifyDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotifyDialogComponent],
      imports: [ MatDialogModule, UxlibModule ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {}
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotifyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
