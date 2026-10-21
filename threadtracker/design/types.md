# ThreadTracker Application Types

Everyone in ThreadTracker is identified by their account username. Each book a class
reads is a chart, with chapters as rows and literary elements as columns, and the
ideas in its cells are posts.

The bindings preserve these application decisions:

- A session identifies the account whose credentials were accepted.
- Charts are owned by accounts, and their members are accounts.
- The items placed in a chart's cells are posts. Only top-level posts are placed;
  a comment belongs to the cell of the post it responds to, through `commentOn`.
- Posts and comments are authored by accounts.
- Accounts upvote posts.
- Reading progress is tracked per account and per chart, so each book has its own
  progress.

```instances
instantiate Authenticating

instantiate Sessioning with
  Subject is Authenticating.Account

instantiate Charting with
  User is Authenticating.Account
  Item is Posting.Post

instantiate Posting with
  User is Authenticating.Account

instantiate Upvoting with
  User is Authenticating.Account
  Item is Posting.Post

instantiate Progressing with
  User is Authenticating.Account
  Context is Charting.Chart
```
