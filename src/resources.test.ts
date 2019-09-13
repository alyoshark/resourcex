import { Resource, LocalStorageResource, NaiveResource } from './resources';

const initialState = { val: 0 };
const actions = {
  add: ({ val }: { val: number }, amt: number) => ({ val: val + amt }),
};

describe('Resource', () => {
  const getCounter = () => Resource(initialState, actions);

  test('Returning original data on initial subscription', done => {
    getCounter().subscribe(data => {
      expect(data.val).toBe(0);
      done();
    });
  });

  test('Counter is incremented correctly', async () => {
    const c = getCounter();
    await c.add(1);
    c.subscribe(({ val }) => {
      expect(val).toBe(1);
    });
  });

  test('Throw error on overwriting Subject methods', () => {
    const r = () => Resource({}, { getValue: () => 1 });
    expect(r).toThrow(Error);
  });
});

describe('NaiveResource', () => {
  const getCounter = () => NaiveResource(initialState);

  test('Set state to given value', async () => {
    const c = getCounter();
    await c.set({ val: 1 });
    c.subscribe(({ val }) => {
      expect(val).toBe(1);
    });
  });
});

describe('LocalStorageResource', () => {
  const getCounter = () =>
    LocalStorageResource('counter', initialState, actions);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Set state to given value and store it in localStorage on initialization', () => {
    getCounter();
    expect(localStorage.getItem).toBeCalledWith('counter');
    expect(localStorage.setItem).toBeCalledWith(
      'counter',
      JSON.stringify({ val: 0 }),
    );
  });

  test('Set state to localStorage value on initialization', () => {
    const lsv = JSON.stringify({ val: 1 });
    (localStorage.getItem as jest.Mock).mockReturnValueOnce(lsv);
    getCounter();
    expect(localStorage.getItem).toBeCalledWith('counter');
    expect(localStorage.setItem).not.toBeCalled();
  });

  test('Store new state to localStorage on action invocation', async () => {
    const c = getCounter();
    await c.add(1);
    expect(localStorage.setItem).toBeCalledWith(
      'counter',
      JSON.stringify({ val: 1 }),
    );
  });
});
