import { Resource } from './resources';

const getCounter = () =>
  Resource(
    { val: 0 },
    { add: ({ val }: { val: number }, amt: number) => ({ val: val + amt }) },
  );

test('Returning original data on initial subscription', done => {
  getCounter().subscribe(data => {
    expect(data.val).toBe(0);
    done();
  });
});

test('Counter is incremented correctly', async done => {
  const c = getCounter();
  await c.add(1);
  c.subscribe(data => {
    expect(data.val).toBe(1);
    done();
  });
});

test('Throw error on overwriting Subject methods', () => {
  const r = () => Resource({}, { getValue: () => 1 });
  expect(r).toThrow(Error);
});
