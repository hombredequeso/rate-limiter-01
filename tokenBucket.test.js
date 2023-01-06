
const {TokenBucket, save, retrieve} = require('./tokenBucket');
const LimitedValue = require('./limitedValue');

describe('TokenBucket', ()=> {
  test('constructs as expected', () => {
    const capacity = 100;
    const fillRateTokensPerSecond = 0.5;
    const fillTime = 1234;
    const tokenBucket = new TokenBucket(capacity, fillRateTokensPerSecond, fillTime);

    const expectedTokenBucket = {
      fillTime : fillTime,
      fillRateTokensPerSecond : fillRateTokensPerSecond,
      limited : new LimitedValue(0, capacity, capacity)
    };

    expect(tokenBucket).toEqual(expectedTokenBucket);
  });

  describe('processRequest', () => {
    test('succeeds when no tokens are available and cost is 0', () => {
      const capacity = 0;
      const fillRateTokensPerSecond = 0;
      const fillTime = 1234;
      const tokenBucket = new TokenBucket(capacity, fillRateTokensPerSecond, fillTime);

      expect(tokenBucket.processRequest(0)).toBe(true);
    })

    test('fails when no tokens are available', () => {
      const capacity = 0;
      const fillRateTokensPerSecond = 0;
      const fillTime = 1234;
      const tokenBucket = new TokenBucket(capacity, fillRateTokensPerSecond, fillTime);

      expect(tokenBucket.processRequest(1)).toBe(false);
    })

    test('succeeds when tokens are available', () => {
      const capacity = 1;
      const fillRateTokensPerSecond = 0;
      const fillTime = 1234;
      const tokenBucket = new TokenBucket(capacity, fillRateTokensPerSecond, fillTime);

      expect(tokenBucket.processRequest(1)).toBe(true);
    })

    describe('fill', () => {
      test('puts specified number of tokens in the bucket', () => {
        const capacity = 10;
        const fillRateTokensPerSecond = 0;
        const fillTime = 1234;
        const tokenBucket = new TokenBucket(capacity, fillRateTokensPerSecond, fillTime);
        tokenBucket.processRequest(9);
        expect(tokenBucket.fill(7)).toBe(8)
      })

      test('puts specified number of tokens in the bucket without exceeding bucket size', () => {
        const capacity = 10;
        const fillRateTokensPerSecond = 0;
        const fillTime = 1234;
        const tokenBucket = new TokenBucket(capacity, fillRateTokensPerSecond, fillTime);
        tokenBucket.processRequest(6);
        expect(tokenBucket.fill(7)).toBe(10)
      })
    })

    describe('fillAt', () => {
      test('adds the rated number of tokens based on time difference', () => {
        const capacity = 10;
        const fillRateTokensPerSecond = 2;
        const fillTime = 1000;
        const tokenBucket = new TokenBucket(capacity, fillRateTokensPerSecond, fillTime);
        tokenBucket.processRequest(9);
        const newTime = 1000 + (3 * 1000);
        expect(tokenBucket.fillAt(newTime)).toBe(7)
      })
    })

  })
})

