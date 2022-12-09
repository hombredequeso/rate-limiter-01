const limitValue = (limits, a) => {
    if (a < limits.min) return limits.min;
    if (a > limits.max) return limits.max;
    return a;
}

const add = (limited, x) => {
    let that = {
        limits: limited.limits,
        value: limitValue(limited.limits, limited.value + x)
    };
    that.add = (x) => {return add(that, x)}
    that.subtract = (x) => {return add(that,-x)}
    return that;
}

const create = (min, max, value) => {
    let that = {
        limits: {min, max}, 
        value,
    };
    that.add = (x) => {return add(that, x)}
    that.subtract = (x) => {return add(that,-x)}
    return that;
    };

module.exports = {
    create
};
