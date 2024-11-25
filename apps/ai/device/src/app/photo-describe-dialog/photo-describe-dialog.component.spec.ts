import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhotoDescribeDialogComponent } from './photo-describe-dialog.component';

describe('PhotoDescribeDialogComponent', () => {
  let component: PhotoDescribeDialogComponent;
  let fixture: ComponentFixture<PhotoDescribeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoDescribeDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoDescribeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
