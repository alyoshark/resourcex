// prettier-ignore
import { Subject, BehaviorSubject, ReplaySubject, Subscriber, of, from, Observable } from 'rxjs';
import { scan } from 'rxjs/operators';
import { ISpec, IResource, IAction, ILocalStorage } from './interfaces';

// By default a reducer would just substitute the previous value
function DEFAULT_REDUCER<R>(_: R, val: R): R {
  return val;
}

export function Resource<R>(spec: ISpec<R>, seed?: R): IResource<R> {
  const scanner = (curr: R, { action, data }: { action: string; data: any }) =>
    (spec[action].reducer || DEFAULT_REDUCER)(curr, data);
  const subject = new Subject<{ action: string; data: any }>();
  const $ = new ReplaySubject<R>(1);
  subject.pipe(scan(scanner, seed)).subscribe($);
  return resourceInit(spec, subject, $);
}

export function BehaviorResource<R>(spec: ISpec<R>, seed: R): IResource<R> {
  const scanner = (curr: R, { action, data }: { action: string; data: any }) =>
    (spec[action].reducer || DEFAULT_REDUCER)(curr, data);
  const subject = new Subject<{ action: string; data: any }>();
  const $ = new BehaviorSubject<R>(seed);
  subject.pipe(scan(scanner, seed)).subscribe($);
  return resourceInit(spec, subject, $);
}

function isPromise(p: any) {
  return p && typeof p.then === 'function';
}

function isObservable(ob: any) {
  return ob && typeof ob.subscribe === 'function';
}

function resourceInit<R>(
  spec: ISpec<R>,
  subject: Subject<{ action: string; data: any }>,
  $: Subject<R>,
): IResource<R> {
  let locker = false;
  const lock$ = new BehaviorSubject<Boolean>(locker);
  const setLocker = (isLocked: boolean) => {
    locker = isLocked;
    lock$.next(locker);
  };

  type TResource<S extends ISpec<R>> = {
    [P in keyof S]?: ((...args: any[]) => Promise<any>) | Observable<any>
  } & {
    $: Observable<R>;
    lock$: Observable<Boolean>;
  };

  const result: TResource<ISpec<R>> = { $, lock$ };
  Object.keys(spec).forEach(action => {
    const { epic, lock } = spec[action];
    result[action] = (...params: any): Promise<any> =>
      new Promise((resolve, reject) => {
        if (lock && locker) return;
        if (lock) setLocker(true);
        const res = epic(...params);
        const subscriber = Subscriber.create(
          (data: any) => {
            subject.next({ action, data });
            resolve(data);
          },
          (e: Error) => {
            setLocker(false);
            reject(e);
          },
          () => setLocker(false),
        );
        if (isObservable(res)) res.subscribe(subscriber);
        else if (isPromise(res)) from(res).subscribe(subscriber);
        else of(res).subscribe(subscriber);
      });
  });
  return result;
}

export function NaiveSetter<R>(): IAction<R, R> {
  return { epic: (x: R) => of(x), reducer: DEFAULT_REDUCER };
}

export function NaiveResource<R>(init: R) {
  return BehaviorResource({ set: NaiveSetter() }, init);
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
    },
  };
}

const ls = LocalStorage();
export function LocalStorageResource<R>(key: string, defaultVal: R) {
  const fromLS = localStorage.getItem(key);
  const val = fromLS ? JSON.parse(fromLS) : defaultVal;
  window.localStorage.setItem(key, JSON.stringify(val));
  return BehaviorResource(
    {
      set: { epic: v => ls.set(key, v) },
      del: { epic: () => ls.del(key) },
    },
    val,
  );
}

export function wrap(fn: (...params: any[]) => any) {
  return (...params: any[]) => {
    const res = fn(...params);
    if (isPromise(res)) return from(res);
    else return of(res);
  };
}
