const LimitedValue = require('./limitedValue');

test('create limited value works', () => {
  const limited = new LimitedValue(1, 3, 2);
  expect(limited.value).toBe(2);
  expect(limited.min).toBe(1);
  expect(limited.max).toBe(3);
});


test('add limited value works', () => {
  const a = new LimitedValue(1, 100, 10);
  const b = a.add(1);
  expect(b.value).toBe(11);
});

test('subtract limited value works', () => {
  const a = new LimitedValue(1, 100, 10);
  const b = a.subtract(1);
  expect(b.value).toBe(9);
});

const fc = require('fast-check');

const minMaxArb = fc.integer().chain(min => fc.tuple(fc.constant(min), fc.integer({min})));

const minMaxAndValuesInRange = (count) =>
 fc.integer()
 .chain(min => fc.tuple(fc.constant(min), fc.integer({min})))
 .chain(minMax => fc.tuple(
                      fc.constant(minMax[0]), 
                      fc.constant(minMax[1]), 
                      fc.array(fc.integer({min: minMax[0],max: minMax[1]}), {minLength: count, maxLength: count})));

test('new LimitedValue always has value in specified range', () => {
  fc.assert(
    fc.property(minMaxArb, fc.integer(), (minMax, i) => {
      const limited = new LimitedValue(minMax[0], minMax[1], i);
      expect(limited.value).toBeGreaterThanOrEqual(limited.min);
      expect(limited.value).toBeLessThanOrEqual(limited.max);
    })
  );
})

test('adding to a LimitedValue is within range and greater than or equal to start', () => {
  fc.assert(
    fc.property(minMaxArb, fc.integer(), fc.integer({min:0}), (minMax, i, addAmount) => {
      const limited = new LimitedValue(minMax[0], minMax[1], i);
      const result = limited.add(addAmount);

      expect(result.value).toBeGreaterThanOrEqual(limited.min);
      expect(result.value).toBeLessThanOrEqual(limited.max);
      expect(result.value).toBeGreaterThanOrEqual(limited.value);
    })
  );
})

test('Adding is commutative', () => {
  fc.assert(
    fc.property(minMaxAndValuesInRange(2), ([min, max, values]) => {
      console.log({min, max, values})

      const limited1 = new LimitedValue(min, max, values[0]).add(values[1]);
      const limited2 = new LimitedValue(min, max, values[1]).add(values[0]);

      expect(limited1.value).toBe(limited2.value);
    })
  );
})
