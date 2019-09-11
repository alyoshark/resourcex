import { BehaviorSubject } from 'rxjs';

const _predef = new Set([
  // BehaviorSubject
  'value',
  'getValue',
  'next',

  // Subject
  'observers',
  'closed',
  'isStopped',
  'hasError',
  'thrownError',
  'lift',
  'error',
  'complete',
  'unsubscribe',
  'asObservable',

  // Observable
  'source',
  'operator',
  'pipe',
  'subscribe',
  'lift',
  'forEach',
  'toPromise',
]);

const checkMethod = (name: string) => {
  if (_predef.has(name)) throw Error(`"${name}" cannot be overwritten!!!`);
};

export function Resource<
  R,
  S extends { [s: string]: Function },
  T extends { [s in keyof S]: Function }
>(init: R, actions: S = {} as S): BehaviorSubject<R> & T {
  const subject = new BehaviorSubject(init);
  const EMPTY_PROTO = {} as T;
  return Object.assign(
    subject,
    Object.keys(actions).reduce((acc, k) => {
      checkMethod(k);
      const action = async (...args: any[]) => {
        const state = subject.getValue();
        const result = await actions[k](state, ...args);
        subject.next({ ...subject.getValue(), ...result });
        return result;
      };
      return { ...acc, [k]: action };
    }, EMPTY_PROTO),
  );
}

export function NaiveResource<R>(init: R) {
  return Resource(init, { set: async (_: any, val: R) => val });
}

export function LocalStorageResource<
  R,
  S extends { [s: string]: Function },
  T extends { [s in keyof S]: Function }
>(key: string, init: R, actions: S = {} as S): BehaviorSubject<R> & T {
  const lsv = window.localStorage.getItem(key);
  if (!lsv) window.localStorage.setItem(key, JSON.stringify(init));
  const EMPTY_PROTO = {} as T;
  return Resource(
    lsv ? JSON.parse(lsv) : init,
    Object.keys(actions).reduce(
      (acc, k) => ({
        ...acc,
        [k]: async (state: any, ...args: any[]) => {
          const result = await actions[k](state, ...args);
          const newVal = { ...state, ...result };
          window.localStorage.setItem(key, JSON.stringify(newVal));
          return result;
        },
      }),
      EMPTY_PROTO,
    ),
  );
}
