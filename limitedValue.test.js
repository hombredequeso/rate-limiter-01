const LimitedValue = require('./limitedValue');

test('create limited value works', () => {
  const limited = new LimitedValue(1, 3, 2);
  expect(limited.value).toBe(2);
  expect(limited.min).toBe(1);
  expect(limited.max).toBe(3);
});

describe('limitedValue.add', ()=> {
  test('allows add within range', () => {
    const a = new LimitedValue(1, 100, 10);
    expect(a.add(1)).toEqual(
      new LimitedValue(1,100, 11));
  });

  test('disallows add outside range upper bound', () => {
    const a = new LimitedValue(1, 100, 99);
    expect(a.add(2)).toEqual(a);
  });


  test('disallows add outside range lower bound', () => {
    const a = new LimitedValue(1, 100, 2);
    expect(a.add(-3)).toEqual(
      new LimitedValue(1,100, 2));
  });
})

describe('limitedValue.subtract', ()=> {
  test('allows subtract within range', () => {
    const a = new LimitedValue(1, 100, 10);
    expect(a.subtract(1)).toEqual(
      new LimitedValue(1,100, 9));
  });

  test('disallows add outside range lower bound', () => {
    const a = new LimitedValue(1, 100, 2);
    expect(a.subtract(3)).toEqual(a);
  });

  test('disallows add outside range upper bound', () => {
    const a = new LimitedValue(1, 100, 99);
    expect(a.subtract(-2)).toEqual(a);
  });
})

describe('limitedValue.truncatedAdd', () => {
  test('adds full amount within range', () => {
    const a = new LimitedValue(1, 100, 10);
    expect(a.truncatedAdd(1)).toEqual(
      new LimitedValue(1,100, 11));
  });

  test('adds to max amount when add outside range upper bound', () => {
    const a = new LimitedValue(1, 100, 99);
    expect(a.truncatedAdd(2)).toEqual(new LimitedValue(1, 100, 100));
  });

  test('adds to min when add outside range lower bound', () => {
    const a = new LimitedValue(1, 100, 2);
    expect(a.truncatedAdd(-3)).toEqual(
      new LimitedValue(1,100, 1));
  });
})

describe('limitedValue.truncatedSubtract', () => {
  test('subtracts full amount within range', () => {
    const a = new LimitedValue(1, 100, 10);
    expect(a.truncatedSubtract(1)).toEqual(
      new LimitedValue(1,100, 9));
  });

  test('subtracts to min amount when subtract outside range lower bound', () => {
    const a = new LimitedValue(1, 100, 2);
    expect(a.truncatedSubtract(2)).toEqual(new LimitedValue(1, 100, 1));
  });

  test('subtracts to max when subtract above range upper bound', () => {
    const a = new LimitedValue(1, 100, 99);
    expect(a.truncatedSubtract(-3)).toEqual(
      new LimitedValue(1,100, 100));
  });
})

const fc = require('fast-check');

const minMaxArb = fc.integer().chain(min => fc.tuple(fc.constant(min), fc.integer({ min })));

const naturalLimitedValue = 
  fc.nat()
    .chain(min => fc.tuple(fc.constant(min), fc.integer({ min })))
    .chain(([min, max]) => new LimitedValue(min, max, fc.integer({min,max})));

const minMaxAndValuesInRangeNat = (count) =>
  fc.nat()
    .chain(min => fc.tuple(fc.constant(min), fc.integer({ min })))
    .chain(([min, max]) => fc.tuple(
      fc.constant(min),
      fc.constant(max),
      fc.array(fc.integer({ min, max }), { minLength: count, maxLength: count })));

test('new LimitedValue always has value in specified range', () => {
  fc.assert(
    fc.property(minMaxArb, fc.integer(), ([min, max], i) => {
      const limited = new LimitedValue(min, max, i);
      expect(limited.value).toBeGreaterThanOrEqual(limited.min);
      expect(limited.value).toBeLessThanOrEqual(limited.max);
    })
  );
})

test('adding to a LimitedValue is within range and greater than or equal to start', () => {
  fc.assert(
    fc.property(minMaxArb, fc.integer(), fc.integer({ min: 0 }), ([min, max], i, addAmount) => {
      const limited = new LimitedValue(min, max, i);
      const result = limited.add(addAmount);

      expect(result.value).toBeGreaterThanOrEqual(limited.min);
      expect(result.value).toBeLessThanOrEqual(limited.max);
      expect(result.value).toBeGreaterThanOrEqual(limited.value);
    })
  );
})

test('adding and subtracting invert one another, if adding works', () => {
  fc.assert(
    fc.property(minMaxAndValuesInRangeNat(2), ([min, max, [a, b]]) => {
      const limitedA = new LimitedValue(min, max, a);
      const result = limitedA.add(b).subtract(b);
      if (a+b <= max) 
        expect(result).toEqual(limitedA)
      else 
        expect(result.value).toBeLessThanOrEqual(limitedA.value);
    })
  )
})

test('subtracting then adding invert one another, if subtracting works', () => {
  fc.assert(
    fc.property(minMaxAndValuesInRangeNat(2), ([min, max, [a, b]]) => {
      const limitedA = new LimitedValue(min, max, a);
      const result = limitedA.subtract(b).add(b);
      if (a-b >= min) 
        expect(result).toEqual(limitedA)
      else 
        expect(result.value).toBeGreaterThanOrEqual(limitedA.value);
    })
  )
})

