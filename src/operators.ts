import { Observable, OperatorFunction, from } from 'rxjs';
import { mergeMap, switchMap, exhaustMap } from 'rxjs/operators';

const catchFlat = <R>(strategy: (p: any) => OperatorFunction<any[], R>) => (
  mapper: (...args: any[]) => Promise<any>,
) => (in$: Observable<any[]>) =>
  in$.pipe(
    strategy((...args: any[]) =>
      from(
        (async () => {
          try {
            return await mapper(...args);
          } catch (e) {
            console.error(e);
            return null;
          }
        })(),
      ),
    ),
  );

export const catchMergeMap = catchFlat(mergeMap);
export const catchFlatMap = catchFlat(mergeMap);
export const catchSwitchMap = catchFlat(switchMap);
export const catchExhaustMap = catchFlat(exhaustMap);
