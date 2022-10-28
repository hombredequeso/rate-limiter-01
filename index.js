const express = require('express');
const app = express();
const port = 3000;

const loggerMiddleware = function(req, res, next) {
    console.log('middleware logger');
    next();
}

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


var tokenBucket = {
    capacity: 10,
    tokens: 10
};

const twoSeconds = 2000;

setInterval(() => {
    const [newBucket, success] = fillTokenBucket(tokenBucket);
    tokenBucket = newBucket;
}, twoSeconds);

const processRequest = () => {
    const [newBucket, success] = emptyTokenBucket(tokenBucket);
    tokenBucket = newBucket;
    return success;
}




const serviceRateLimiterMiddleware = (req, res, next) => {
    console.log("tokenBucket: " + JSON.stringify(tokenBucket));
    const shouldProcessRequest = processRequest();
    console.log({shouldProcessRequest})
    if (!shouldProcessRequest) {
        res.status(429).send({});
        return;
    }
    next();
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
