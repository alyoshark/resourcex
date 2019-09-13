import { BehaviorSubject } from 'rxjs';
import { TSnapshot, wrapMiddleware } from './middleware';

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
>(
  init: R,
  actions: S = {} as S,
  middleware: (x: any) => Promise<any> = async x => x,
  initHook: (x: R) => R = x => x,
): BehaviorSubject<R> & T {
  const subject = new BehaviorSubject(initHook(init));
  const EMPTY_PROTO = {} as T;
  return Object.assign(
    subject,
    Object.keys(actions).reduce((acc, k) => {
      checkMethod(k);
      const action = async (...args: any[]) => {
        const state = subject.getValue();
        const val = await actions[k](state, ...args);
        const snapshot = { val, args, state, action: k };
        const { val: result } = await middleware(snapshot);
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
  const middleware = ({ val }: TSnapshot<R>) => {
    window.localStorage.setItem(key, JSON.stringify(val));
    return val;
  };
  const initHook = (x: R) => {
    const lsv = window.localStorage.getItem(key);
    if (!lsv) window.localStorage.setItem(key, JSON.stringify(x));
    return lsv ? JSON.parse(lsv) : x;
  };
  return Resource(init, actions, wrapMiddleware([middleware]), initHook);
}
