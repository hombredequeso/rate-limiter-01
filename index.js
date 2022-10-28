const express = require('express');
const app = express();
const port = 3000;

const loggerMiddleware = function(req, res, next) {
    console.log('middleware logger');
    next();
}

// incrementing and decrementing within limits
const limitedIncrement = (current, limit) => (current === limit)? current: current + 1;
const limitedDecrement = (current, limit) => (current === limit)? current: current - 1;

const fillTokenBucket = (bucket) => {
    const newTokens = limitedIncrement(bucket.tokens, bucket.capacity);
    return [
        {
            capacity: bucket.capacity,
            tokens: newTokens
        },
        bucket.tokens != newTokens
    ];
}

const emptyTokenBucket = (bucket) => {
    const newTokens = limitedDecrement(bucket.tokens, 0);
    return [
        {
            capacity: bucket.capacity,
            tokens: newTokens
        },
        bucket.tokens != newTokens
    ];
}


// createTokenBucket: given a capacity, return fill function, and processRequest function
// Can be tested using fill function.
// Just like (real) Object Oriented :-) . You send it messages and that's it!
const createTokenBucket = (capacity) => {
    var tokenBucket = {
        capacity: capacity,
        tokens: capacity 
    };

    const fill = () => {
        const [newBucket, _success] = fillTokenBucket(tokenBucket);
        tokenBucket = newBucket;
    }

    const processRequest = () => {
        const [newBucket, success] = emptyTokenBucket(tokenBucket);
        tokenBucket = newBucket;
        return success;
    }
    return [fill, processRequest];
}

// Setup the bucket:
const bucketCapacity = 4;
const [fill, processRequest] = createTokenBucket(bucketCapacity);
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
