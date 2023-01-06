This is code for eductional purposes. It most certainly should not be used, as is (part of the education of this version is what can go wrong!)

# Introduction

This code has an api, with a rate limiter that is applied to every single request. The rate limiter is persisted in Redis. However, the way it is persisted illustrates the need for a transaction around the redis retrieve/save operations, when manipulating the TokenBucket.

## Requirements
A redis instance is required at url: 'redis://127.0.0.1:6379'

One simple way to achieve this is:
```
docker run --name test-redis --rm -p:6379:6379 -d redis
```

# Usage

```
yarn
yarn start
```

Then watch the rate limiting:
```
while true; do curl localhost:3000; sleep 1; done
```


## Redis Hints

To connect redis-cli and view that gets persisted try:
```
docker run -it --rm --network host redis redis-cli -u redis://127.0.0.1:6379

> KEYS *
> get tokenbucket:api:object

```
