import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectCodeComponent } from './connect-code.component';
import { firstValueFrom } from 'rxjs';
import { CodeFetcher } from '../code-fetcher';
import { CodeFetcherMock } from '../code-fetcher.mock';

describe('ConnectCodeComponent', () => {

  const codeFetcher = new CodeFetcherMock();

  let component: ConnectCodeComponent;
  let fixture: ComponentFixture<ConnectCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConnectCodeComponent],
      providers: [
        {
          provide: CodeFetcher,
          useValue: codeFetcher
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set the refreshingSoon variable when the observable emits', async () => {

    expect(fixture.nativeElement.classList).not.toContain('refreshing');

    codeFetcher.refreshingSoon$.next(true);
    expect(component.refreshingSoon).toBe(true);

    fixture.detectChanges();
    await fixture.whenRenderingDone();

    // Check that the refreshing class was now added
    expect(fixture.nativeElement.classList).toContain('refreshing');

    codeFetcher.refreshingSoon$.next(false);
    expect(component.refreshingSoon).toBe(false);
  });

  it('should set the currentCode variable when the observable emits', async () => {
    await expect(firstValueFrom(component.currentCode$)).resolves.toBeNull();

    codeFetcher.currentCode$.next({ connectCode: '123456', expiryDate: new Date() });

    await expect(firstValueFrom(component.currentCode$)).resolves.toBe('123456');
  });
});
