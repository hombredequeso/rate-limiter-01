
// TokenBucket is the state management of LimitedValue.
// Practically LimitedValue is immutable
// TokenBucket carries the state, and provides an interface
//    implementing the Bucket filling model.

const LimitedValue = require('./limitedValue');


function TokenBucket(capacity, fillRateTokensPerSecond, fillTime) {
  this.fillTime = fillTime;
  this.fillRateTokensPerSecond = fillRateTokensPerSecond;   
  this.limited = new LimitedValue(0, capacity, capacity);
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

module.exports = TokenBucket;
