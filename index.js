/* eslint-disable object-curly-newline */
import { Subject, ReplaySubject, from, of, BehaviorSubject } from 'rxjs';
import { scan, take } from 'rxjs/operators';
/* eslint-enable object-curly-newline */

// By default a reducer would just substitute the previous value
const DEFAULT_REDUCER = (acc, val) => val;

function createState(SubjectType) {
  return (actions, init) => {
    // init subject of type & decide scan base case
    const isBS = SubjectType === BehaviorSubject;
    const newInit = isBS ? init : undefined;
    const scanner = (curr, { action, data }) =>
      (actions[action].reducer || DEFAULT_REDUCER)(curr, data);
    const subject = new SubjectType(newInit);
    const $ = new ReplaySubject(1);
    subject.pipe(isBS ? scan(scanner) : scan(scanner, init)).subscribe($);

    // init lock
    let locker = false;
    const lock$ = new BehaviorSubject(locker);
    const setLocker = (isLocked) => {
      locker = isLocked;
      lock$.next(locker);
    };

    // construct action table
    const result = { $, lock$ };
    Object.keys(actions).forEach((action) => {
      const { epic, lock } = actions[action];
      result[action] = (...params) =>
        new Promise((resolve, reject) => {
          if (lock && locker) return;
          if (lock) setLocker(true);
          epic(...params)
            .pipe(take(1))
            .subscribe(
              (data) => {
                subject.next({ action, data });
                setLocker(false);
                resolve(data);
              },
              (e) => {
                setLocker(false);
                reject(e);
              },
            );
        });
    });
    return result;
  };
}

export const State = createState(Subject);
const InitializedState = createState(BehaviorSubject);

export const NaiveSetter = () => ({
  epic: (x) => of(x),
  reducer: DEFAULT_REDUCER,
});
export function NaiveState(init) {
  return InitializedState({ set: NaiveSetter() }, init);
}

function LocalStorage() {
  const subjects = {};
  const { localStorage } = window;
  const registered = (k) => Object.prototype.hasOwnProperty.call(subjects, k);

  return {
    get(key, defaultVal) {
      if (registered(key)) return subjects[key];
      if (!localStorage.getItem(key) && defaultVal) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
      }
      const fromLS = localStorage.getItem(key);
      const val = fromLS ? JSON.parse(fromLS) : defaultVal;
      subjects[key] = new BehaviorSubject(val);
      return subjects[key];
    },
    set(key, val) {
      localStorage.setItem(key, JSON.stringify(val));
      if (registered(key)) subjects[key].next(val);
      return of(val);
    },
    del(key) {
      localStorage.removeItem(key);
      if (registered(key)) subjects[key].next(null);
      return of(null);
    },
  };
}

const ls = LocalStorage();
export function LocalStorageState(key, defaultVal) {
  const fromLS = localStorage.getItem(key);
  const val = fromLS ? JSON.parse(fromLS) : defaultVal;
  window.localStorage.setItem(key, JSON.stringify(val));
  return InitializedState(
    {
      set: { epic: (v) => ls.set(key, v) },
      del: { epic: () => ls.del(key) },
    },
    val,
  );
}

export function wrap(fn) {
  return (...params) => from(fn(...params));
}
