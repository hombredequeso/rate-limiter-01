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

To introduce delays before saving to redis use -d with number of milliseconds (e.g. for testing optimistic concurrency):
```
yarn start -d 2000
```

For a request to specify a user set a 'user' header. Rate limiting is per user. 
e.g.
```
curl localhost:3000 -H "user:123"
```


## Redis Hints

To connect redis-cli and view what gets persisted try:
```
docker run -it --rm --network host redis redis-cli -u redis://127.0.0.1:6379

> KEYS *
> get tokenbucket:api:object

```

## Misc notes

limitedValue: this type is immutable. Any method called on the object produces a new object, rather than modifying the 'this' object.
tokenBucket: this type is mutable. As such, it takes a traditional object-oriented approach.

There is no reason for mixing what is essentially a functional paradigm (limitedValue) together with oo (tokenBucket) other than for pedagogical reasons.

# TAGS notes

??todo

* in-memory
* illustrates separation of domain concepts. limitedValue implements a maths domain; tokenBucket uses it to implement token Bucket.
* traditional javascript, explicit constructors with prototypes manually added.

redis-non-transactional

* persistence: redis, serialized entity, non-atomic
* how to add persistence into an in-memory system. For instance:
    * illustrates dealing with deserialisation -> entity.
    * keeping domain model intact and adding persistence, not modifying existing system. i.e. persistence separate concern to the domain.

redis-serialized-atomic

* persistence: redis, serialized entity, atomic
    * (note) Doesn't use the RedisJSON module - purely for pedagogical simplicity.
* Uses optimistic concurrency (via redis WATCH).
* alternatives/questions about how to treat errors - and what is an error (esp. tokenBucket.save - what should we do in catch? We have to at least do something when optimistic concurrency fails, which it does with an exception.)

redis-multiple-basic-keys-atomic

* persistence: redis, simple keys, atomic
* User optimistic concurrency on multiple keys, all of which are components of the same object.
* this avoid object serialization/deserialization, which may be considered desirable.

