const limitValue = (min, max, a) => {
  if (a < min) return min;
  if (a > max) return max;
  return a;
}

function LimitedValue(min, max, value) {
  this.min = min;
  this.max = max;
  this.value = limitValue(this.min, this.max, value);
}

function LimitedValuePersisted(retrievedLimitedValue) {
  this.min = retrievedLimitedValue.min;
  this.max = retrievedLimitedValue.max;
  this.value = limitValue(this.min, this.max, retrievedLimitedValue.value);
}

const limitedValuePrototype = {
  add: function (x) {
    const newValue = this.value + x;
    if (newValue > this.max) return this;
    if (newValue < this.min) return this;
    return new LimitedValue(this.min, this.max, newValue);
  },
  subtract: function (x) {
    return this.add(-x);
  },
  truncatedAdd: function (x) {
    return new LimitedValue(this.min, this.max, this.value + x);
  },
  truncatedSubtract: function (x) {
    return this.truncatedAdd(-x);
  }
}

Object.assign(LimitedValue.prototype, limitedValuePrototype);
Object.assign(LimitedValuePersisted.prototype, limitedValuePrototype);

module.exports = {
  LimitedValue,
  LimitedValuePersisted};
