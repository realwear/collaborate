import { BehaviorSubject } from "rxjs";
import { auditWhen } from "./audit-when.operator";

describe('auditWhen', () => {
  it('should work', () => {
    const isRefreshing$ = new BehaviorSubject<boolean>(false);

    const source = new BehaviorSubject<number | null>(0);

    const emittedValues: (number | null)[] = [];

    source.pipe(auditWhen(isRefreshing$)).subscribe(val => emittedValues.push(val));

    source.next(1);
    source.next(2);

    isRefreshing$.next(true);

    // 3 should be skipped
    source.next(3);

    // 4 will be emitted later
    source.next(4);
    expect(emittedValues).toEqual([0, 1, 2]);

    isRefreshing$.next(false);

    // 4 will be emitted here
    expect(emittedValues).toEqual([0, 1, 2, 4]);

    source.next(5);

    expect(emittedValues).toEqual([0, 1, 2, 4, 5]);
  });

  it('should emit null as a valid value', () => {
    const isRefreshing$ = new BehaviorSubject<boolean>(false);

    const source = new BehaviorSubject<number | null>(0);

    const emittedValues: (number | null)[] = [];

    source.pipe(auditWhen(isRefreshing$)).subscribe(val => emittedValues.push(val));

    source.next(1);

    isRefreshing$.next(true);

    source.next(2);
    source.next(null);

    isRefreshing$.next(false);

    expect(emittedValues).toEqual([0, 1, null]);
  });
});
