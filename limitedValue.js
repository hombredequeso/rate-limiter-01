const getLimits = (min, max) => ({
    min: min,
    max: max
})

const limitValue = (limits, a) => {
    if (a < limits.min) return limits.min;
    if (a > limits.max) return limits.max;
    return a;
}

const add = (limits, a, b) => limitValue(limits, a + b);

const subtract = (limits, a, b) => limitValue(limits, a-b);

module.exports = {
    getLimits,
    limitValue,
    add,
    subtract
}
