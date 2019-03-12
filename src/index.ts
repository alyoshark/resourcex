/* eslint-disable object-curly-newline */
import { Subject, BehaviorSubject, ReplaySubject, from, of } from 'rxjs';
import { scan, take } from 'rxjs/operators';
import { ISpec, IState, IAction, ILocalStorage } from './interfaces';
/* eslint-enable object-curly-newline */

// By default a reducer would just substitute the previous value
function DEFAULT_REDUCER<R>(_: R, val: R): R {
  return val;
}

function createState<R>(spec: ISpec<R>, seed?: R): IState<R> {
  const scanner = (curr: R, { action, data }: { action: string; data: any }) =>
    (spec[action].reducer || DEFAULT_REDUCER)(curr, data);
  const subject = new Subject<{ action: string; data: any }>();
  const $ = new ReplaySubject<R>(1);
  subject.pipe(scan(scanner, seed)).subscribe($);

  let locker = false;
  const lock$ = new BehaviorSubject<Boolean>(locker);
  const setLocker = (isLocked: boolean) => {
    locker = isLocked;
    lock$.next(locker);
  };

  const result: IState<R> = { $, lock$ };
  Object.keys(spec).forEach(action => {
    const { epic, lock } = spec[action];
    result[action] = (...params: any): Promise<any> =>
      new Promise((resolve, reject) => {
        if (lock && locker) return;
        if (lock) setLocker(true);
        epic(...params)
          .pipe(take(1))
          .subscribe(
            (data: any) => {
              subject.next({ action, data });
              setLocker(false);
              resolve(data);
            },
            (e: Error) => {
              setLocker(false);
              reject(e);
            }
          );
      });
  });
  return result;
}

export function State<R>(spec: ISpec<R>) {
  return createState(spec);
}

export function NaiveSetter<R>(): IAction<R, R> {
  return { epic: (x: R) => of(x), reducer: DEFAULT_REDUCER };
}

export function NaiveState<R>(init: R) {
  return createState({ set: NaiveSetter() }, init);
}

function LocalStorage(): ILocalStorage {
  const subjects: { [key: string]: any } = {};
  const { localStorage } = window;
  const registered = (k: string) =>
    Object.prototype.hasOwnProperty.call(subjects, k);

  return {
    get(key: string, defaultVal: any) {
      if (registered(key)) return subjects[key];
      if (!localStorage.getItem(key) && defaultVal) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
      }
      const fromLS = localStorage.getItem(key);
      const val = fromLS ? JSON.parse(fromLS) : defaultVal;
      subjects[key] = new BehaviorSubject(val);
      return subjects[key];
    },
    set(key: string, val: any) {
      localStorage.setItem(key, JSON.stringify(val));
      if (registered(key)) subjects[key].next(val);
      return of(val);
    },
    del(key: string) {
      localStorage.removeItem(key);
      if (registered(key)) subjects[key].next(null);
      return of(null);
    }
  };
}

const ls = LocalStorage();
export function LocalStorageState<R>(key: string, defaultVal: R) {
  const fromLS = localStorage.getItem(key);
  const val = fromLS ? JSON.parse(fromLS) : defaultVal;
  window.localStorage.setItem(key, JSON.stringify(val));
  return createState(
    {
      set: { epic: v => ls.set(key, v) },
      del: { epic: () => ls.del(key) }
    },
    val
  );
}

export function wrap(fn: (...params: any[]) => Promise<any>) {
  return (...params: any[]) => from(fn(...params));
}
