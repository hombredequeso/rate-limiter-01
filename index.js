const express = require('express');
const app = express();
const port = 3000;

const loggerMiddleware = function(req, res, next) {
    console.log('middleware logger');
    next();
}

const LimitedValue = require('./limitedValue');

// createTokenBucket: given a capacity, return fill function, and processRequest function
// Can be tested using fill function.
// Just like (real) Object Oriented :-) . You send it messages and that's it!

function TokenBucket(capacity) {
    this.limited = new LimitedValue(0, capacity, capacity);
}
const tokenBucketPrototype = {
    fill : function() {
        const filled = this.limited.add(1);
        const success = filled.value != this.limited.value;
        this.limited = filled;
        return success;
    },

    processRequest : function () {
        const emptied = this.limited.subtract(1);
        const success = emptied.value != this.limited.value;
        this.limited = emptied;
        return success;
    }
}
Object.assign(TokenBucket.prototype, tokenBucketPrototype);

// Setup the bucket:
const bucketCapacity = 4;
const tokenBucket = new TokenBucket(bucketCapacity);

const twoSeconds = 2000;
setInterval(() => {
    tokenBucket.fill();
}, twoSeconds);

// middleware limiter:
const serviceRateLimiterMiddleware = (req, res, next) => {
    if (tokenBucket.processRequest()) {
        next();
        return;
    }
    console.log("Limited")
    res.status(429).send({});
}

app.use(loggerMiddleware);
app.use(serviceRateLimiterMiddleware);


app.get('/',
    (req, res, next) => {
        console.log('get / middleware before');
        next();
    },
    (req, res, next) => {
        // throw 'Exceptional';
        console.log('handler');
        res.header('Content-Type', 'application/json');
        res.status(200).send({ version: '1.2.3.4'});
        next();
    },
    (req, res, next) => {
        console.log('get / middleware after');
        next();
    },
);

// const errorLogger = (error, request, response, next) => {
//     const err = JSON.stringify(error);
//     console.log("errorlogger : " + err);
//     // response.header('Content-Type', 'application/json');
//     response.status(500).send({error: err});
//     return;
//     next(error) // calling next middleware
// }

// app.use(errorLogger);


app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))
