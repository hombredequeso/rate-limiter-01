const limitedValue = require('./limitedValue');


test('create limited value works', () => {
    const limited = limitedValue.create(1, 3, 2);
    expect(limited.value).toBe(2);
    expect(limited.limits).toStrictEqual({ min: 1, max: 3 })
});


test('add limited value works', () => {
    const a = limitedValue.create(1, 100, 10);
    const b = a.add(1);
    expect(b.value).toBe(11);
});

test('subtract limited value works', () => {
    const a = limitedValue.create(1, 100, 10);
    const b = a.subtract(1);
    expect(b.value).toBe(9);
});