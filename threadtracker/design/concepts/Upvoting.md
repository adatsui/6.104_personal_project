# Upvoting

## Purpose

Let people signal the most valuable items, so the most valuable items stand out.

## Principle

After a user upvotes an item, the count of the item increases by one; if they remove
the upvote, the count decreases by one. A user can upvote an item at most once.

## Types

```types
external User
  The person who upvotes an item.

external Item
  The thing being upvoted, such as a post.
```

## State

```state
a set of Upvotes with
  a voter User
  an item Item
  unique voter and item
```

## Actions

```actions
upvote(voter: User, item: Item) : returns ()
  where some upvote has voter and item
  then
    refuses ALREADY_UPVOTED "You have already upvoted this."
  where no upvote has voter and item
  then
    add a new upvote with voter and item
    returns

unvote(voter: User, item: Item) : returns ()
  where no upvote has voter and item
  then
    refuses NOT_UPVOTED "You have not upvoted this."
  where some upvote has voter and item
  then
    remove that upvote
    returns

clear(item: Item) : returns ()
  where true
  then
    remove every upvote with item
    returns
```

## Queries

```queries
_count(item: Item) : one (count: Number)
  answers the number of upvotes with item
  answers 0 for an item with no upvotes

_hasUpvoted(voter: User, item: Item) : one (result: Flag)
  answers true when some upvote has voter and item
  answers false otherwise
```
