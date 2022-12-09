const LimitedValue = require('./limitedValue');

test('create limited value works', () => {
    const limited = new LimitedValue(1,3,2);
    expect(limited.value).toBe(2);
    expect(limited.min).toBe(1);
    expect(limited.max).toBe(3);
});


test('add limited value works', () => {
    const a = new LimitedValue(1,100,10);
    const b = a.add(1);
    expect(b.value).toBe(11);
});

test('subtract limited value works', () => {
    const a = new LimitedValue(1,100,10);
    const b = a.subtract(1);
    expect(b.value).toBe(9);
});