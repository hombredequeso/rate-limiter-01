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
const limitedValuePrototype = {
  add: function (x) {
    return new LimitedValue(this.min, this.max, this.value + x);
  },
  subtract: function (x) {
    return new LimitedValue(this.min, this.max, this.value - x)
  },
}

Object.assign(LimitedValue.prototype, limitedValuePrototype);

module.exports = LimitedValue;