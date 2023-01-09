const express = require('express');
var args = require('node-args');
const app = express();
const port = 3000;

const loggerMiddleware = function (req, res, next) {
  console.log('middleware logger');
  next();
}

const createClient = require('redis').createClient;
const redisClient = createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));

function delayMs(millisec) {
  return new Promise(resolve => {
    setTimeout(() => { resolve('') }, millisec);
  })
}

let saveDelayMs = args.d || args.delay;

(async () => {

  await redisClient.connect();

  const { TokenBucket, save, save2, retrieve, retrieve2 } = require('./tokenBucket');

  // middleware limiter:
  const serviceRateLimiterMiddleware = async (req, res, next) => {
    const userId = req.header('user') || 'api';
    const retrievedTokenBucket = await retrieve2(redisClient, userId);
    const fillResult = retrievedTokenBucket.fillAndProcessRequest(Date.now(), 1);

    if (saveDelayMs) {
      console.log(`delay ${saveDelayMs} ms`);
      const waitResult = await delayMs(saveDelayMs);
    }

    const saveResult = await save2(retrievedTokenBucket, redisClient, userId);
    if (saveResult && fillResult) {
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
      res.status(200).send({ version: '1.2.3.4' });
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

})();