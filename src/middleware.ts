export type TSnapshot<R> = {
  val: any;
  action: string;
  args: any[];
  state: R;
};

export function wrapMiddleware<R>(funs: ((s: TSnapshot<R>) => Promise<any>)[]) {
  return async (input: TSnapshot<R>) =>
    funs.reduce((acc, f) => ({ ...acc, val: f(acc) }), input);
}
