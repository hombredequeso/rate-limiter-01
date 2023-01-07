
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

const tokenBucketPrototype = {
  fillAndProcessRequest: function (time, cost) {
    this.fillAt(time);
    return this.processRequest(cost);
  },
  fillAt: function (time) {
    const secondsSinceLastFill = Math.floor((time - this.fillTime) / 1000);
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

function waitforme(millisec) {
  return new Promise(resolve => {
    setTimeout(() => { resolve('') }, millisec);
  })
}

const tokenBucketKey = `tokenbucket:api`;
async function save(tokenBucket, redisClient) {
  console.log("saving with wait...")
  const waitResult = await waitforme(3000);
  console.log("... finished waiting")
  const value = JSON.stringify(tokenBucket);
  const result = await redisClient
    .multi()
    .set(`tokenbucket:api:object`, value)
    .exec()
    .catch((err) => {
      console.log({ err });
      return ['FAILED'];
    });
  console.log(`multi.set.exec result: ${result}`)
  const resultStr = result.join(':');
  console.log(`type: ${typeof result}; obj: ${JSON.stringify(result)}; elements: ${resultStr}`);
  console.log(`${result[0]}; ${typeof result[0]}`)
  // await multi.set(`tokenbucket:api:object`, value);
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

module.exports = {
  TokenBucket,
  save,
  retrieve
};
