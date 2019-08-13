import { useState, useEffect } from 'react';

export const useObservable = observable => {
  const [value, setValue] = useState(observable.getValue());
  useEffect(() => {
    const subscription = observable.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [observable]);
  return value;
};
