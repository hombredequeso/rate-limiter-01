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

const minMaxArb = fc.integer().chain(min => fc.tuple(fc.constant(min), fc.integer({ min })));

const minMaxAndValuesInRange = (count) =>
  fc.integer()
    .chain(min => fc.tuple(fc.constant(min), fc.integer({ min })))
    .chain(([min, max]) => fc.tuple(
      fc.constant(min),
      fc.constant(max),
      fc.array(fc.integer({ min, max }), { minLength: count, maxLength: count })));

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

test('Adding is commutative', () => {
  fc.assert(
    fc.property(minMaxAndValuesInRange(2), ([min, max, values]) => {
      // console.log({ min, max, values })

      const limited1 = new LimitedValue(min, max, values[0]).add(values[1]);
      const limited2 = new LimitedValue(min, max, values[1]).add(values[0]);

      expect(limited1.value).toBe(limited2.value);
    })
  );
})

// Note that adding is not associative for integers. e.g. this would fail: [0, 1, [1,1,-1]]
test('Adding is associative for natural numbers', () => {
  fc.assert(
    fc.property(minMaxAndValuesInRangeNat(3), ([min, max, [a, b, c]]) => {

      const limited1 = new LimitedValue(min, max, a).add(b);
      const result1 = limited1.add(c);
      const limited2 = new LimitedValue(min, max, a);
      const limited3 = new LimitedValue(min, max, b).add(c);
      const result2 = limited2.add(limited3.value);

      expect(result1.value).toBe(result2.value);
    })
  );
})

