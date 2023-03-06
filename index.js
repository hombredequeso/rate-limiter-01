const express = require('express');
const app = express();
const port = 3000;

const loggerMiddleware = function (req, res, next) {
  console.log('middleware logger');
  next();
}

const createClient = require('redis').createClient;
// const redisClient = createClient();
// redisClient.on('error', (err) => console.log('Redis Client Error', err));


(async () => {

  // await redisClient.connect();

  const { TokenBucket, save, retrieve } = require('./tokenBucket');

  // Setup the bucket:
  // const bucketCapacity = 4;
  // const fillRateTokensPerSecond = 0.5;
  // const tokenBucket = new TokenBucket(bucketCapacity, fillRateTokensPerSecond, Date.now());
  // tokenBucket.fill(10);
  // await save(tokenBucket, redisClient);

  // middleware limiter:
  const serviceRateLimiterMiddleware = async (req, res, next) => {

    const redisClient2 = createClient();
    await redisClient2.connect();
    redisClient2.on('error', (err) => console.log('Redis Client Error', err));

    const retrievedTokenBucket = await retrieve(redisClient2);
    const fillResult = retrievedTokenBucket.fillAndProcessRequest(Date.now(), 1);
    const saveResult = await save(retrievedTokenBucket, redisClient2);
    redisClient2.quit();
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