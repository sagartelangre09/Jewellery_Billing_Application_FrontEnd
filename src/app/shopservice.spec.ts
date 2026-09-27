import { TestBed } from '@angular/core/testing';

import { Shopservice } from './shopservice';

describe('Shopservice', () => {
  let service: Shopservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Shopservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
