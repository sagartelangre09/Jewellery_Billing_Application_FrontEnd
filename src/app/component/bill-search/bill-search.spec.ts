import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillSearch } from './bill-search';

describe('BillSearch', () => {
  let component: BillSearch;
  let fixture: ComponentFixture<BillSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
