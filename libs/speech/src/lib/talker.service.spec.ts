import { TestBed } from '@angular/core/testing';

import { TalkerService } from './talker.service';
import { SpeechConfig } from 'microsoft-cognitiveservices-speech-sdk';

describe('TalkerService', () => {
  let service: TalkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SpeechConfig,
          useValue: {}
        },
        TalkerService
      ]
    });
    service = TestBed.inject(TalkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
