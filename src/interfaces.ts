import { Observable } from 'rxjs';

type IReducer<R, T> = (curr: R, val: T) => R;
type IEpic<R> = (...args: any[]) => Observable<R>;

export interface IAction<R, T> {
  epic: IEpic<R>;
  reducer?: IReducer<R, T>;
  lock?: Boolean;
}

export interface ISpec<R> {
  [key: string]: IAction<R, any>;
}

export interface IState<R> {
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
