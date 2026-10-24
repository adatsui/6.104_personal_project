# Progressing

## Purpose

Track how far each user is in a context, so later content can be withheld until they
reach it.

## Principle

After a user upvotes an item, the count of the item increases by one; if they remove
the upvote, the count decreases by one. A user can upvote an item at most once.

## Types

```types
external User
  The person whose progress is tracked.

external Context
  The thing a user progresses through, such as a book's chart.
```

## State

```state
a set of Progresses with
  a user User
  a context Context
  a reached Number
  unique user and context
```

## Actions

```actions
setProgress(user: User, context: Context, reached: Number) : returns ()
  where reached is not a whole number of at least 0
  then
    refuses INVALID_PROGRESS "Progress must be a whole number of at least 0."
  where reached is a whole number of at least 0
  then
    set the progress of user in context to reached
    returns

checkReached(user: User, context: Context, step: Number) : returns ()
  where step is greater than the progress of user in context, which is 0 when none is recorded
  then
    refuses NOT_REACHED "You haven't marked this chapter as read yet."
  where step is at most the progress of user in context
  then
    returns
```

## Queries

```queries
_reached(user: User, context: Context) : one (reached: Number)
  answers the progress of user in context
  answers 0 when no progress is recorded for user and context
```
