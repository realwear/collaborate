import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RefineDialogComponent } from './refine-dialog.component';

describe('RefineDialogComponent', () => {
  let component: RefineDialogComponent;
  let fixture: ComponentFixture<RefineDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefineDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RefineDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
