import { BehaviorSubject } from 'rxjs';

export function Resource<R>(init: R, actions: { [s: string]: Function }) {
  const subject = new BehaviorSubject(init);
  return Object.assign(
    subject,
    Object.keys(actions).reduce((acc, k) => {
      const action = async (...args: any[]) => {
        const state = subject.getValue();
        const result = await actions[k](state, ...args);
        subject.next({ ...state, ...result });
      };
      return { ...acc, [k]: action };
    }, {}),
  );
}

export const NaiveResource = <R>(init: R) =>
  Resource(init, { set: async (_: any, val: R) => val });

export function LocalStorageResource<R>(
  key: string,
  init: R,
  actions: { [s: string]: Function },
) {
  const lsv = window.localStorage.getItem(key);
  if (!lsv) window.localStorage.setItem(key, JSON.stringify(init));
  const subject = new BehaviorSubject<R>(lsv ? JSON.parse(lsv) : init);
  return Object.assign(
    subject,
    Object.keys(actions).reduce((acc, k) => {
      const action = async (...args: any[]) => {
        const state = subject.getValue();
        const result = await actions[k](state, ...args);
        const newVal = { ...state, ...result };
        window.localStorage.setItem(key, JSON.stringify(newVal));
        subject.next(newVal);
      };
      return { ...acc, [k]: action };
    }, {}),
  );
}
