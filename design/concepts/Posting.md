# Posting

## Purpose

Let people contribute ideas and respond to the ideas of others, so an idea and the
discussion of it stay together and attributed.

## Principle

A user creates a post with a quote and its citation, an analysis, or both. Others can
comment on the post, and its comments are listed under it, oldest first. Only the
author of a post can edit or delete it, and deleting a post also deletes its comments.

## Types

```types
external User
  The person who authors a post or comment.
```

## State

```state
a seq of Posts with
  an author User
  an optional quote String
  an optional citation String
  an optional analysis String
  an optional commentOn Post

Rule: a post has a quote exactly when it has a citation
Rule: a post has a quote, an analysis, or both
```

## Actions

```actions
create(author: User, quote?: String, citation?: String, analysis?: String) : returns (post: Post)
  where exactly one of quote and citation is given
  then
    refuses QUOTE_NEEDS_CITATION "A quote needs a citation, and a citation needs a quote."
  where neither quote nor analysis is given
  then
    refuses EMPTY_POST "A post needs a quote, an analysis, or both."
  where quote and citation are both given or both omitted, and quote or analysis is given
  then
    add a new post with author, quote, citation, and analysis
    returns post

comment(author: User, commentOn: Post, quote?: String, citation?: String, analysis?: String) : returns (post: Post)
  where commentOn is not in Posts
  then
    refuses POST_NOT_FOUND "There is no such post."
  where exactly one of quote and citation is given
  then
    refuses QUOTE_NEEDS_CITATION "A quote needs a citation, and a citation needs a quote."
  where neither quote nor analysis is given
  then
    refuses EMPTY_POST "A post needs a quote, an analysis, or both."
  where commentOn is in Posts and the content is accepted
  then
    add a new post with author, quote, citation, analysis, and commentOn
    returns post

edit(post: Post, author: User, quote?: String, citation?: String, analysis?: String) : returns ()
  where post is not in Posts
  then
    refuses POST_NOT_FOUND "There is no such post."
  where author is not the author of post
  then
    refuses NOT_AUTHOR "Only the author of this post can change it."
  where exactly one of quote and citation is given
  then
    refuses QUOTE_NEEDS_CITATION "A quote needs a citation, and a citation needs a quote."
  where neither quote nor analysis is given
  then
    refuses EMPTY_POST "A post needs a quote, an analysis, or both."
  where author is the author of post and the content is accepted
  then
    set the quote, citation, and analysis of post
    returns

delete(post: Post, author: User) : returns ()
  where post is not in Posts
  then
    refuses POST_NOT_FOUND "There is no such post."
  where author is not the author of post
  then
    refuses NOT_AUTHOR "Only the author of this post can change it."
  where author is the author of post
  then
    remove post and every post linked to it through commentOn, directly or indirectly
    returns
```

## Queries

```queries
_get(post: Post) : optional (author: User, quote?: String, citation?: String, analysis?: String)
  answers the author and content of post
  answers no row for an unknown post

_comments(post: Post) : many (comment: Post, author: User, quote?: String, citation?: String, analysis?: String)
  answers every post whose commentOn is post, with its author and content
  answers no rows for a post with no comments or an unknown post
  orders rows by when each comment was created, oldest first

_thread(post: Post) : many (post: Post)
  answers post and every post linked to it through commentOn, directly or indirectly
  answers no rows for an unknown post
  orders rows by when each post was created
```
