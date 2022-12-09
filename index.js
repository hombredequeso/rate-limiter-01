const express = require('express');
const app = express();
const port = 3000;

const loggerMiddleware = function(req, res, next) {
    console.log('middleware logger');
    next();
}

const limitedValue = require('./limitedValue');

// createTokenBucket: given a capacity, return fill function, and processRequest function
// Can be tested using fill function.
// Just like (real) Object Oriented :-) . You send it messages and that's it!
const createTokenBucket = (capacity) => {
    const limits = limitedValue.getLimits(0, capacity);
    var tokenCount = capacity;

    const fill = () => {
        const newCount = limitedValue.add(limits, tokenCount, 1);
        const success = newCount != tokenCount;
        tokenCount = newCount;
        return success;
    }

    const processRequest = () => {
        const newCount = limitedValue.subtract(limits, tokenCount, 1);
        const success = newCount != tokenCount;
        tokenCount = newCount;
        return success;
    }
    return {fill, processRequest};
}

// Setup the bucket:
const bucketCapacity = 4;
const {fill, processRequest} = createTokenBucket(bucketCapacity);
const twoSeconds = 2000;
setInterval(() => {
    fill();
}, twoSeconds);

// middleware limiter:
const serviceRateLimiterMiddleware = (req, res, next) => {
    if (processRequest()) {
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
