
// TokenBucket is the state management of LimitedValue.
// Practically LimitedValue is immutable
// TokenBucket carries the state, and provides an interface
//    implementing the Bucket filling model.


const { LimitedValue, LimitedValuePersisted } = require('./limitedValue');

function TokenBucket(capacity, fillRateTokensPerSecond, fillTime) {
  this.fillTime = fillTime;
  this.fillRateTokensPerSecond = fillRateTokensPerSecond;
  this.limited = new LimitedValue(0, capacity, capacity);
}

function TokenBucketPersisted(retrievedTokenBucket) {
  this.fillTime = retrievedTokenBucket.fillTime;
  this.fillRateTokensPerSecond = retrievedTokenBucket.fillRateTokensPerSecond;
  this.limited = new LimitedValuePersisted(retrievedTokenBucket.limited);
}


function TokenBucketPersisted2(fillTime, fillRateTokensPerSecond, limited) {
  this.fillTime = fillTime;
  this.fillRateTokensPerSecond = fillRateTokensPerSecond;
  this.limited = limited
}


const tokenBucketPrototype = {
  fillAndProcessRequest: function (time, cost) {
    this.fillAt(time);
    return this.processRequest(cost);
  },
  fillAt: function (time) {
    const secondsSinceLastFill = (time - this.fillTime) / 1000;
    const fillAmount = (secondsSinceLastFill * this.fillRateTokensPerSecond);
    this.fillTime = time;
    return this.fill(fillAmount)
  },
  fill: function (amount) {
    const filled = this.limited.truncatedAdd(amount);
    const success = filled.value != this.limited.value;
    this.limited = filled;
    return this.limited.value;
  },

  processRequest: function (requestCost) {
    const emptied = this.limited.subtract(requestCost);
    const success = requestCost === 0 || emptied.value != this.limited.value;
    this.limited = emptied;
    return success;
  }
}

Object.assign(TokenBucket.prototype, tokenBucketPrototype);
Object.assign(TokenBucketPersisted.prototype, tokenBucketPrototype);
Object.assign(TokenBucketPersisted2.prototype, tokenBucketPrototype);

function waitforme(millisec) {
  return new Promise(resolve => {
    setTimeout(() => { resolve('') }, millisec);
  })
}

const tokenBucketKey = `tokenbucket:api`;
async function save(tokenBucket, redisClient) {
  const value = JSON.stringify(tokenBucket);
  const result = await redisClient
    .multi()
    .set(`tokenbucket:api:object`, value)
    .exec()
    .catch((err) => {
      console.log({ err });
      return ['FAILED'];
    });
  return result[0] === 'OK';
}

async function save2(tokenBucket, redisClient, key) {
  const result = await redisClient
    .multi()
    .set(`tokenbucket:${key}:limited.value`, tokenBucket.limited.value)
    .set(`tokenbucket:${key}:filltime`, tokenBucket.fillTime)
    .exec()
    .catch((err) => {
      console.log({ err });
      return ['FAILED'];
    });
  return result[0] === 'OK';
}

async function retrieve(redisClient) {

  await redisClient.watch(`tokenbucket:api:object`)
  const value = await redisClient.get(`tokenbucket:api:object`);
  if (value === null) {
    const bucketCapacity = 4;
    const fillRateTokensPerSecond = 0.5;
    const newTokenBucket = new TokenBucket(bucketCapacity, fillRateTokensPerSecond, Date.now());
    return newTokenBucket;
  }

  const deserializedValue = JSON.parse(value);
  const tokenBucket = new TokenBucketPersisted(deserializedValue);
  return tokenBucket;
}

const defaultBucketCapacity = 4;
const defaultFillRateTokensPerSecond = 0.5;

const timeToFillSeconds = defaultBucketCapacity / defaultFillRateTokensPerSecond;
// Could set a TTL of something greater than this, and system would work.

async function retrieve2(redisClient, key) {

  await redisClient.watch(`tokenbucket:${key}:limited.value`);
  await redisClient.watch(`tokenbucket:${key}:filltime`);

  const limitedValueS = await redisClient.get(`tokenbucket:${key}:limited.value`);
  const fillTimeS = await redisClient.get(`tokenbucket:${key}:filltime`);

  const limitedValue = parseFloat(limitedValueS);
  const fillTime = parseInt(fillTimeS);

  if (limitedValue === null || Number.isNaN(limitedValue)) {
    const newTokenBucket = new TokenBucket(defaultBucketCapacity, defaultFillRateTokensPerSecond, Date.now());
    return newTokenBucket;
  }

  const limited = new LimitedValue(0, defaultBucketCapacity, limitedValue);
  const tokenBucket = new TokenBucketPersisted2(fillTime, defaultFillRateTokensPerSecond, limited);
  return tokenBucket;
}


module.exports = {
  TokenBucket,
  save,
  retrieve,
  save2,
  retrieve2
};
