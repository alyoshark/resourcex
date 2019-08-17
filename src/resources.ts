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

export const Resource = <R>(init: R, actions: { [s: string]: Function }) => {
  const subject = new BehaviorSubject(init);
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
    }, {}),
  );
};

export const NaiveResource = <R>(init: R) =>
  Resource(init, { set: async (_: any, val: R) => val });

export const LocalStorageResource = <R>(
  key: string,
  init: R,
  actions: { [s: string]: Function },
) => {
  const lsv = window.localStorage.getItem(key);
  if (!lsv) window.localStorage.setItem(key, JSON.stringify(init));
  const subject = new BehaviorSubject<R>(lsv ? JSON.parse(lsv) : init);
  return Object.assign(
    subject,
    Object.keys(actions).reduce((acc, k) => {
      checkMethod(k);
      const action = async (...args: any[]) => {
        const state = subject.getValue();
        const result = await actions[k](state, ...args);
        const newVal = { ...subject.getValue(), ...result };
        window.localStorage.setItem(key, JSON.stringify(newVal));
        subject.next(newVal);
        return result;
      };
      return { ...acc, [k]: action };
    }, {}),
  );
};
