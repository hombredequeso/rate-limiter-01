
// TokenBucket is the state management of LimitedValue.
// Practically LimitedValue is immutable
// TokenBucket carries the state, and provides an interface
//    implementing the Bucket filling model.


const {LimitedValue, LimitedValuePersisted} = require('./limitedValue');

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
  fillAndProcessRequest: function(time, cost) {
    this.fillAt(time);
    return this.processRequest(cost);
  },
  fillAt: function (time) {
    const secondsSinceLastFill = Math.floor((time - this.fillTime)/1000);
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


const tokenBucketKey = `tokenbucket:api`;
async function save(tokenBucket, redisClient) {
  const value = JSON.stringify(tokenBucket);
  await redisClient.set(`tokenbucket:api:object`, value);
}

async function retrieve(redisClient) {
  const value = await redisClient.get(`tokenbucket:api:object`);
  const deserializedValue = JSON.parse(value);
  const tokenBucket = new TokenBucketPersisted(deserializedValue);
  return tokenBucket;
}

module.exports = {
  TokenBucket,
  save,
  retrieve};
