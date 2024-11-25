import { BehaviorSubject } from "rxjs";
import { distinctArray } from "./distinct-array.operator";

describe('distinctArray', () => {
    it('should work with numbered arrays', () => {
        // Arrange
        const source = new BehaviorSubject<number[]>([0]);
        const emittedValues: number[][] = [];
        source.pipe(distinctArray()).subscribe(val => emittedValues.push(val));

        source.next([1, 2, 3]);
        source.next([1, 2, 3]);
        source.next([1, 2, 4]);
        source.next([1, 2, 4, 5]);
        source.next([1, 2, 4, 5]);
        source.next([1, 2, 4, 5]);
        source.next([1, 2, 4, 5]);
        source.next([1, 2, 4, 5, 6]);
        source.next([1, 2, 4, 5, 6]);
        source.next([1, 2, 4, 5, 6]);
        source.next([1, 2, 4, 5, 6]);
        source.next([3]);

        // Assert
        expect(emittedValues).toEqual([[0], [1, 2, 3], [1, 2, 4], [1, 2, 4, 5], [1, 2, 4, 5, 6], [3]]);
    });

    it('should work with string arrays', () => {
        // Arrange
        const source = new BehaviorSubject<string[]>(['0']);
        const emittedValues: string[][] = [];
        source.pipe(distinctArray()).subscribe(val => emittedValues.push(val));

        source.next(['1', '2', '3']);
        source.next(['1', '2', '3']);
        source.next(['1', '2', '4']);

        source.next(['1', '2', '4', '7']);

        // Assert
        expect(emittedValues).toEqual([['0'], ['1', '2', '3'], ['1', '2', '4'], ['1', '2', '4', '7']]);
    });
});