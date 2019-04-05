import { Observable } from 'rxjs';

// R is for Resource Type, T is any Return Type of epic function

type IReducer<R, T> = (curr: R, val: T) => R;
type IEpic<T> = (...args: any[]) => Observable<T>;

export interface IAction<R, T> {
  epic: IEpic<T>;
  reducer?: IReducer<R, T>;
  lock?: Boolean;
}

export interface ISpec<R> {
  [key: string]: IAction<R, any>;
}

export interface IResource<R> {
  $: Observable<R>;
  lock$: Observable<Boolean>;
  // Union with Observable<any> only to make type check work >___<
  [key: string]: ((...args: any[]) => Promise<any>) | Observable<any>;
}

// Auxiliary interfaces
export interface ILocalStorage {
  get: (key: string, defaultVal: any) => any;
  set: (key: string, val: any) => Observable<any>;
  del: (key: string) => Observable<null>;
}
