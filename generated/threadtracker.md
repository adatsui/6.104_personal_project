<!-- Generated from the ThreadTracker assembly. Do not edit. -->
<!-- Manifest producer: @mit-sdg/sync-engine@1.1.0; concept specification: sync-engine.concept-specification@1; renderer: @mit-sdg/sync-engine@1.1.0. -->

# ThreadTracker — assembled read-back

_Assembled by sync-engine from registered concepts and composition. Edit the concept_
_specifications and composition source, then regenerate this file._

## Concepts

### Authenticating

Defined in [Authenticating](../design/concepts/Authenticating.md), line 1.

#### Actions

- `register(username: String, password: String) : returns (account: Account)`
  - Refuses `INVALID_USERNAME`: A username must contain 3 to 32 letters, numbers, underscores, or hyphens.
  - Refuses `WEAK_PASSWORD`: A password must contain 8 to 128 characters.
  - Refuses `USERNAME_TAKEN`: That username is already registered.
- `authenticate(username: String, password: String) : returns (account: Account)`
  - Refuses `INVALID_CREDENTIALS`: The username or password is incorrect.

#### Queries

- `_registered(username: String) : one (registered: Flag)`

#### Instances

- `Authenticating` — instance of `Authenticating` — [ThreadTracker Application Types](../design/types.md), line 19.

### Charting

Defined in [Charting](../design/concepts/Charting.md), line 1.

#### Actions

- `createChart(title: String, owner: User, rowLabels: Labels, columnLabels: Labels) : returns (chart: Chart)`
  - Refuses `DUPLICATE_ROW`: This chart already has a row with that label.
  - Refuses `DUPLICATE_COLUMN`: This chart already has a column with that label.
- `addMember(chart: Chart, owner: User, user: User) : returns ()`
  - Refuses `CHART_NOT_FOUND`: There is no such chart.
  - Refuses `NOT_OWNER`: Only the owner of this chart can add members.
  - Refuses `ALREADY_MEMBER`: That person is already a member of this chart.
- `addColumn(chart: Chart, label: String, user: User) : returns (column: Column)`
  - Refuses `CHART_NOT_FOUND`: There is no such chart.
  - Refuses `NOT_MEMBER`: You are not a member of this chart.
  - Refuses `DUPLICATE_COLUMN`: This chart already has a column with that label.
- `addItem(item: Item, chart: Chart, row: Row, column: Column, user: User) : returns ()`
  - Refuses `CHART_NOT_FOUND`: There is no such chart.
  - Refuses `NOT_MEMBER`: You are not a member of this chart.
  - Refuses `NOT_IN_CHART`: That chapter or literary element is not in this chart.
  - Refuses `ALREADY_PLACED`: That item is already in a cell.
- `deleteItem(item: Item, chart: Chart) : returns ()`
  - Refuses `ITEM_NOT_FOUND`: That post is not in this chart.
- `checkMember(chart: Chart, user: User) : returns ()`
  - Refuses `CHART_NOT_FOUND`: There is no such chart.
  - Refuses `NOT_MEMBER`: You are not a member of this chart.
- `checkRow(row: Row, chart: Chart) : returns (index: Number)`
  - Refuses `NOT_IN_CHART`: That chapter or literary element is not in this chart.
- `checkItem(item: Item, chart: Chart) : returns (index: Number)`
  - Refuses `ITEM_NOT_FOUND`: That post is not in this chart.

#### Queries

- `_get(chart: Chart) : optional (title: String, owner: User)`
- `_chartsFor(user: User) : many (chart: Chart, title: String, owner: User)`
- `_rows(chart: Chart) : many (row: Row, label: String, index: Number)`
- `_columns(chart: Chart) : many (column: Column, label: String)`
- `_items(chart: Chart) : many (item: Item, row: Row, index: Number, column: Column)`
- `_placement(item: Item) : optional (chart: Chart)`

#### Instances

- `Charting` — instance of `Charting` — [ThreadTracker Application Types](../design/types.md), line 24.
  - `Item` is `Posting.Post` — [ThreadTracker Application Types](../design/types.md), line 26.
  - `User` is `Authenticating.Account` — [ThreadTracker Application Types](../design/types.md), line 25.

### Posting

Defined in [Posting](../design/concepts/Posting.md), line 1.

#### Actions

- `create(author: User, quote?: String, citation?: String, analysis?: String) : returns (post: Post)`
  - Refuses `QUOTE_NEEDS_CITATION`: A quote needs a citation, and a citation needs a quote.
  - Refuses `EMPTY_POST`: A post needs a quote, an analysis, or both.
- `comment(author: User, commentOn: Post, quote?: String, citation?: String, analysis?: String) : returns (post: Post)`
  - Refuses `POST_NOT_FOUND`: There is no such post.
  - Refuses `QUOTE_NEEDS_CITATION`: A quote needs a citation, and a citation needs a quote.
  - Refuses `EMPTY_POST`: A post needs a quote, an analysis, or both.
- `edit(post: Post, author: User, quote?: String, citation?: String, analysis?: String) : returns ()`
  - Refuses `POST_NOT_FOUND`: There is no such post.
  - Refuses `NOT_AUTHOR`: Only the author of this post can change it.
  - Refuses `QUOTE_NEEDS_CITATION`: A quote needs a citation, and a citation needs a quote.
  - Refuses `EMPTY_POST`: A post needs a quote, an analysis, or both.
- `delete(post: Post, author: User) : returns ()`
  - Refuses `POST_NOT_FOUND`: There is no such post.
  - Refuses `NOT_AUTHOR`: Only the author of this post can change it.

#### Queries

- `_get(post: Post) : optional (author: User, quote?: String, citation?: String, analysis?: String)`
- `_comments(post: Post) : many (comment: Post, author: User, quote?: String, citation?: String, analysis?: String)`
- `_thread(post: Post) : many (post: Post)`

#### Instances

- `Posting` — instance of `Posting` — [ThreadTracker Application Types](../design/types.md), line 28.
  - `User` is `Authenticating.Account` — [ThreadTracker Application Types](../design/types.md), line 29.

### Progressing

Defined in [Progressing](../design/concepts/Progressing.md), line 1.

#### Actions

- `setProgress(user: User, context: Context, reached: Number) : returns ()`
  - Refuses `INVALID_PROGRESS`: Progress must be a whole number of at least 0.
- `checkReached(user: User, context: Context, step: Number) : returns ()`
  - Refuses `NOT_REACHED`: You haven't marked this chapter as read yet.

#### Queries

- `_reached(user: User, context: Context) : one (reached: Number)`

#### Instances

- `Progressing` — instance of `Progressing` — [ThreadTracker Application Types](../design/types.md), line 35.
  - `Context` is `Charting.Chart` — [ThreadTracker Application Types](../design/types.md), line 37.
  - `User` is `Authenticating.Account` — [ThreadTracker Application Types](../design/types.md), line 36.

### Sessioning

Defined in [Sessioning](../design/concepts/Sessioning.md), line 1.

#### Actions

- `start(subject: Subject) : returns (session: Session, expiresAt: DateTime)`
- `current(session: Session) : returns (subject: Subject)`
  - Refuses `UNKNOWN_SESSION`: This session is not active.
- `end(session: Session) : returns (ended: Flag)`
  - Refuses `UNKNOWN_SESSION`: This session is not active.

#### Queries

- `_active(session: Session) : optional (subject: Subject, expiresAt: DateTime)`

#### Instances

- `Sessioning` — instance of `Sessioning` — [ThreadTracker Application Types](../design/types.md), line 21.
  - `Subject` is `Authenticating.Account` — [ThreadTracker Application Types](../design/types.md), line 22.

### Upvoting

Defined in [Upvoting](../design/concepts/Upvoting.md), line 1.

#### Actions

- `upvote(voter: User, item: Item) : returns ()`
  - Refuses `ALREADY_UPVOTED`: You have already upvoted this.
- `unvote(voter: User, item: Item) : returns ()`
  - Refuses `NOT_UPVOTED`: You have not upvoted this.
- `clear(item: Item) : returns ()`

#### Queries

- `_count(item: Item) : one (count: Number)`
- `_hasUpvoted(voter: User, item: Item) : one (result: Flag)`

#### Instances

- `Upvoting` — instance of `Upvoting` — [ThreadTracker Application Types](../design/types.md), line 31.
  - `Item` is `Posting.Post` — [ThreadTracker Application Types](../design/types.md), line 33.
  - `User` is `Authenticating.Account` — [ThreadTracker Application Types](../design/types.md), line 32.

## Views

_Views name reusable conditions. Multiple `where` blocks are alternatives._

### row (index) is reached by (user) in (chart)

Authored path: `ThreadTracker.RowReached`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 55.

```view
row (index) is reached by (user) in (chart) — inputs (index, user, chart); outputs (); bindings (reached)
  where
    Progressing._reached (context: chart, user) has (reached)
    index is at most reached
```

## Formers

_Formers name result shapes evaluated when asked. The source former owns_
_the authored explanation; this section records the generated shape._

### (post) as seen by (user)

Authored path: `ThreadTracker.PostCard`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 56.

```former
Former "(post) as seen by (user)" — inputs (post, user); bindings (author, quote, citation, analysis, count, result, comment, commentAuthor, commentQuote, commentCitation, commentAnalysis); promises exactly one record — forms:
  a record of
    where Posting._get (post) has (analysis, author, citation, quote)
    where Upvoting._count (item: post) has (count)
    where Upvoting._hasUpvoted (item: post, voter: user) has (result)
    analysis
    author
    citation
    comments: each Posting._comments (post) has (analysis: commentAnalysis, author: commentAuthor, citation: commentCitation, comment, quote: commentQuote)
      form a record of
        analysis: commentAnalysis
        author: commentAuthor
        citation: commentCitation
        comment
        quote: commentQuote
    quote
    upvoted: result
    upvotes: count
```

### the chart (chart) as seen by (user)

Authored path: `ThreadTracker.ChartView`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 50.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 69.

```former
Former "the chart (chart) as seen by (user)" — inputs (chart, user); bindings (title, owner, reached, row, label, index, unreadRow, unreadIndex, column, columnLabel, post, postRow, postIndex, postColumn); promises exactly one record — forms:
  a record of
    where Charting._get (chart) has (owner, title)
    where Progressing._reached (context: chart, user) has (reached)
    chart
    columns: each Charting._columns (chart) has (column, label: columnLabel)
      form a record of
        column
        label: columnLabel
    owner
    posts: each Charting._items (chart) has (column: postColumn, index: postIndex, item: post, row: postRow)
      where view "row (index) is reached by (user) in (chart)" with (chart, index: postIndex, user)
      form a record of
        card: former "(post) as seen by (user)" with (post, user)
        column: postColumn
        index: postIndex
        post
        row: postRow
    reached
    rows: each Charting._rows (chart) has (index, label, row)
      where view "row (index) is reached by (user) in (chart)" with (chart, index, user)
      form a record of
        index
        label
        row
    title
    unreadRows: each Charting._rows (chart) has (index: unreadIndex, row: unreadRow)
      where unreadIndex is greater than reached
      form a record of
        index: unreadIndex
        row: unreadRow
```

### the charts of (user)

Authored path: `ThreadTracker.ChartList`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 24.

```former
Former "the charts of (user)" — inputs (user); bindings (chart, title, owner); promises exactly one record — forms:
  each Charting._chartsFor (user) has (chart, owner, title)
    form a record of
      chart
      owner
      title
```

## Reactions

### DeliverFaultToAsker

```reaction
when any action is faulted, not asked by DeliverFaultToAsker
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respondFramework (error: "INTERNAL_ERROR", requestId)
```

### DeliverRefusalToAsker

```reaction
when any action is refused (message), except RequestBoundary
where
  earlier, RequestBoundary.request (requestId)
then
  RequestBoundary.respond (error: message, requestId)
```

### Sessions.CurrentUser

Authored path: `Sessions.CurrentUser`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 16.
- Covered by [Sessions](../design/compositions/Sessions.md), line 20.

```reaction
when RequestBoundary.request (path: "/auth/current", requestId, session)
then
  Sessioning.current (session)
```

### Sessions.CurrentUser#2

Authored path: `Sessions.CurrentUser`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 16.
- Covered by [Sessions](../design/compositions/Sessions.md), line 20.

```reaction
when Sessioning.current (session, subject: username), asked by Sessions.CurrentUser
where
  earlier, RequestBoundary.request (path: "/auth/current", requestId, session)
then
  RequestBoundary.respond (requestId, username)
```

### Sessions.Register

Authored path: `Sessions.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 6.
- Covered by [Sessions](../design/compositions/Sessions.md), line 12.

```reaction
when RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  Authenticating.register (password, username)
```

### Sessions.Register#2

Authored path: `Sessions.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 6.
- Covered by [Sessions](../design/compositions/Sessions.md), line 12.

```reaction
when Authenticating.register (password, username, account), asked by Sessions.Register
then
  Sessioning.start (subject: account)
```

### Sessions.Register#3

Authored path: `Sessions.Register`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 6.
- Covered by [Sessions](../design/compositions/Sessions.md), line 12.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.Register#2
where
  earlier, RequestBoundary.request (password, path: "/auth/register", requestId, username)
then
  RequestBoundary.respond (account, expiresAt, requestId, session)
```

### Sessions.SignIn

Authored path: `Sessions.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 7.
- Covered by [Sessions](../design/compositions/Sessions.md), line 13.

```reaction
when RequestBoundary.request (password, path: "/auth/sign-in", requestId, username)
then
  Authenticating.authenticate (password, username)
```

### Sessions.SignIn#2

Authored path: `Sessions.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 7.
- Covered by [Sessions](../design/compositions/Sessions.md), line 13.

```reaction
when Authenticating.authenticate (password, username, account), asked by Sessions.SignIn
then
  Sessioning.start (subject: account)
```

### Sessions.SignIn#3

Authored path: `Sessions.SignIn`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 7.
- Covered by [Sessions](../design/compositions/Sessions.md), line 13.

```reaction
when Sessioning.start (subject: account, expiresAt, session), asked by Sessions.SignIn#2
where
  earlier, RequestBoundary.request (password, path: "/auth/sign-in", requestId, username)
then
  RequestBoundary.respond (account, expiresAt, requestId, session)
```

### Sessions.SignOut

Authored path: `Sessions.SignOut`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 23.
- Covered by [Sessions](../design/compositions/Sessions.md), line 27.

```reaction
when RequestBoundary.request (path: "/auth/sign-out", requestId, session)
then
  Sessioning.end (session)
```

### Sessions.SignOut#2

Authored path: `Sessions.SignOut`.
- Covered by [Sessions](../design/compositions/Sessions.md), line 23.
- Covered by [Sessions](../design/compositions/Sessions.md), line 27.

```reaction
when Sessioning.end (session, ended: signedOut), asked by Sessions.SignOut
where
  earlier, RequestBoundary.request (path: "/auth/sign-out", requestId, session)
then
  RequestBoundary.respond (requestId, signedOut)
```

### ThreadTracker.AddColumn

Authored path: `ThreadTracker.AddColumn`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 30.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 34.

```reaction
when RequestBoundary.request (chart, label, path: "/charts/add-column", requestId, session)
then
  Sessioning.current (session)
```

### ThreadTracker.AddColumn#2

Authored path: `ThreadTracker.AddColumn`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 30.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 34.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.AddColumn
where
  earlier, RequestBoundary.request (chart, label, path: "/charts/add-column", requestId, session)
then
  Charting.addColumn (chart, label, user)
```

### ThreadTracker.AddColumn#3

Authored path: `ThreadTracker.AddColumn`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 30.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 34.

```reaction
when Charting.addColumn (chart, label, user, column), asked by ThreadTracker.AddColumn#2
where
  earlier, RequestBoundary.request (chart, label, path: "/charts/add-column", requestId, session)
then
  RequestBoundary.respond (column, requestId)
```

### ThreadTracker.AddMember

Authored path: `ThreadTracker.AddMember`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 13.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 19.

```reaction
when RequestBoundary.request (chart, path: "/charts/add-member", requestId, session, username)
where
  Authenticating._registered (username) has (registered: true)
then
  Sessioning.current (session)
```

### ThreadTracker.AddMember#2

Authored path: `ThreadTracker.AddMember`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 13.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 19.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.AddMember
where
  earlier, RequestBoundary.request (chart, path: "/charts/add-member", requestId, session, username)
then
  Charting.addMember (chart, owner: user, user: username)
```

### ThreadTracker.AddMember#3

Authored path: `ThreadTracker.AddMember`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 13.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 19.

```reaction
when Charting.addMember (chart, owner: user, user: username), asked by ThreadTracker.AddMember#2
where
  earlier, RequestBoundary.request (chart, path: "/charts/add-member", requestId, session, username)
then
  RequestBoundary.respond (member: username, requestId)
```

### ThreadTracker.CreateChart

Authored path: `ThreadTracker.CreateChart`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 10.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 18.

```reaction
when RequestBoundary.request (columnLabels, path: "/charts/create", requestId, rowLabels, session, title)
then
  Sessioning.current (session)
```

### ThreadTracker.CreateChart#2

Authored path: `ThreadTracker.CreateChart`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 10.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 18.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.CreateChart
where
  earlier, RequestBoundary.request (columnLabels, path: "/charts/create", requestId, rowLabels, session, title)
then
  Charting.createChart (columnLabels, owner: user, rowLabels, title)
```

### ThreadTracker.CreateChart#3

Authored path: `ThreadTracker.CreateChart`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 10.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 18.

```reaction
when Charting.createChart (columnLabels, owner: user, rowLabels, title, chart), asked by ThreadTracker.CreateChart#2
where
  earlier, RequestBoundary.request (columnLabels, path: "/charts/create", requestId, rowLabels, session, title)
then
  RequestBoundary.respond (chart, requestId)
```

### ThreadTracker.CreateComment

Authored path: `ThreadTracker.CreateComment`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 82.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 106.

```reaction
when RequestBoundary.request (analysis, chart, citation, commentOn, path: "/posts/comment", quote, requestId, session)
then
  Sessioning.current (session)
```

### ThreadTracker.CreateComment#2

Authored path: `ThreadTracker.CreateComment`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 82.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 106.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.CreateComment
where
  earlier, RequestBoundary.request (analysis, chart, citation, commentOn, path: "/posts/comment", quote, requestId, session)
then
  Charting.checkMember (chart, user)
```

### ThreadTracker.CreateComment#3

Authored path: `ThreadTracker.CreateComment`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 82.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 106.

```reaction
when Charting.checkMember (chart, user), asked by ThreadTracker.CreateComment#2
where
  earlier, RequestBoundary.request (analysis, chart, citation, commentOn, path: "/posts/comment", quote, requestId, session)
then
  Charting.checkItem (chart, item: commentOn)
```

### ThreadTracker.CreateComment#4

Authored path: `ThreadTracker.CreateComment`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 82.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 106.

```reaction
when Charting.checkItem (chart, item: commentOn, index), asked by ThreadTracker.CreateComment#3
where
  earlier, Sessioning.current (session, subject: user), asked by ThreadTracker.CreateComment
then
  Progressing.checkReached (context: chart, step: index, user)
```

### ThreadTracker.CreateComment#5

Authored path: `ThreadTracker.CreateComment`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 82.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 106.

```reaction
when Progressing.checkReached (context: chart, step: index, user), asked by ThreadTracker.CreateComment#4
where
  earlier, Charting.checkItem (chart, item: commentOn, index), asked by ThreadTracker.CreateComment#3
  earlier, RequestBoundary.request (analysis, chart, citation, commentOn, path: "/posts/comment", quote, requestId, session)
then
  Posting.comment (analysis, author: user, citation, commentOn, quote)
```

### ThreadTracker.CreateComment#6

Authored path: `ThreadTracker.CreateComment`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 82.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 106.

```reaction
when Posting.comment (analysis, author: user, citation, commentOn, quote, post: comment), asked by ThreadTracker.CreateComment#5
where
  earlier, RequestBoundary.request (analysis, chart, citation, commentOn, path: "/posts/comment", quote, requestId, session)
then
  RequestBoundary.respond (comment, requestId)
```

### ThreadTracker.CreatePost

Authored path: `ThreadTracker.CreatePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 78.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 105.

```reaction
when RequestBoundary.request (analysis, chart, citation, column, path: "/posts/create", quote, requestId, row, session)
then
  Sessioning.current (session)
```

### ThreadTracker.CreatePost#2

Authored path: `ThreadTracker.CreatePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 78.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 105.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.CreatePost
where
  earlier, RequestBoundary.request (analysis, chart, citation, column, path: "/posts/create", quote, requestId, row, session)
then
  Charting.checkMember (chart, user)
```

### ThreadTracker.CreatePost#3

Authored path: `ThreadTracker.CreatePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 78.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 105.

```reaction
when Charting.checkMember (chart, user), asked by ThreadTracker.CreatePost#2
where
  earlier, RequestBoundary.request (analysis, chart, citation, column, path: "/posts/create", quote, requestId, row, session)
then
  Charting.checkRow (chart, row)
```

### ThreadTracker.CreatePost#4

Authored path: `ThreadTracker.CreatePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 78.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 105.

```reaction
when Charting.checkRow (chart, row, index), asked by ThreadTracker.CreatePost#3
where
  earlier, Sessioning.current (session, subject: user), asked by ThreadTracker.CreatePost
then
  Progressing.checkReached (context: chart, step: index, user)
```

### ThreadTracker.CreatePost#5

Authored path: `ThreadTracker.CreatePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 78.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 105.

```reaction
when Progressing.checkReached (context: chart, step: index, user), asked by ThreadTracker.CreatePost#4
where
  earlier, RequestBoundary.request (analysis, chart, citation, column, path: "/posts/create", quote, requestId, row, session)
then
  Posting.create (analysis, author: user, citation, quote)
```

### ThreadTracker.CreatePost#6

Authored path: `ThreadTracker.CreatePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 78.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 105.

```reaction
when Posting.create (analysis, author: user, citation, quote, post), asked by ThreadTracker.CreatePost#5
where
  earlier, Charting.checkMember (chart, user), asked by ThreadTracker.CreatePost#2
  earlier, Charting.checkRow (chart, row, index), asked by ThreadTracker.CreatePost#3
  earlier, RequestBoundary.request (analysis, chart, citation, column, path: "/posts/create", quote, requestId, row, session)
then
  Charting.addItem (chart, column, item: post, row, user)
```

### ThreadTracker.CreatePost#7

Authored path: `ThreadTracker.CreatePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 78.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 105.

```reaction
when Charting.addItem (chart, column, item: post, row, user), asked by ThreadTracker.CreatePost#6
where
  earlier, RequestBoundary.request (analysis, chart, citation, column, path: "/posts/create", quote, requestId, row, session)
then
  RequestBoundary.respond (post, requestId)
```

### ThreadTracker.DeleteComment

Authored path: `ThreadTracker.DeleteComment`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 100.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 109.

```reaction
when RequestBoundary.request (chart, comment, path: "/posts/delete-comment", requestId, session)
then
  Sessioning.current (session)
```

### ThreadTracker.DeleteComment#2

Authored path: `ThreadTracker.DeleteComment`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 100.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 109.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.DeleteComment
where
  earlier, RequestBoundary.request (chart, comment, path: "/posts/delete-comment", requestId, session)
then
  Charting.checkMember (chart, user)
```

### ThreadTracker.DeleteComment#3

Authored path: `ThreadTracker.DeleteComment`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 100.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 109.

```reaction
when Charting.checkMember (chart, user), asked by ThreadTracker.DeleteComment#2
where
  earlier, RequestBoundary.request (chart, comment, path: "/posts/delete-comment", requestId, session)
then
  Posting.delete (author: user, post: comment)
```

### ThreadTracker.DeleteComment#4

Authored path: `ThreadTracker.DeleteComment`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 100.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 109.

```reaction
when Posting.delete (author: user, post: comment), asked by ThreadTracker.DeleteComment#3
where
  earlier, RequestBoundary.request (chart, comment, path: "/posts/delete-comment", requestId, session)
then
  RequestBoundary.respond (comment, requestId)
```

### ThreadTracker.DeletePost

Authored path: `ThreadTracker.DeletePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 90.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 108.

```reaction
when RequestBoundary.request (chart, path: "/posts/delete", post, requestId, session)
then
  Sessioning.current (session)
```

### ThreadTracker.DeletePost#2

Authored path: `ThreadTracker.DeletePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 90.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 108.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.DeletePost
where
  earlier, RequestBoundary.request (chart, path: "/posts/delete", post, requestId, session)
then
  Charting.checkMember (chart, user)
```

### ThreadTracker.DeletePost#3

Authored path: `ThreadTracker.DeletePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 90.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 108.

```reaction
when Charting.checkMember (chart, user), asked by ThreadTracker.DeletePost#2
where
  earlier, RequestBoundary.request (chart, path: "/posts/delete", post, requestId, session)
then
  Charting.checkItem (chart, item: post)
```

### ThreadTracker.DeletePost#4

Authored path: `ThreadTracker.DeletePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 90.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 108.

```reaction
when Charting.checkItem (chart, item: post), asked by ThreadTracker.DeletePost#3
where
  earlier, Sessioning.current (session, subject: user), asked by ThreadTracker.DeletePost
then
  Posting.delete (author: user, post)
```

### ThreadTracker.DeletePost#5

Authored path: `ThreadTracker.DeletePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 90.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 108.

```reaction
when Posting.delete (author: user, post), asked by ThreadTracker.DeletePost#4
where
  earlier, RequestBoundary.request (chart, path: "/posts/delete", post, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### ThreadTracker.DeletedPostLeavesChart

Authored path: `ThreadTracker.DeletedPostLeavesChart`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 96.

```reaction
when Posting.delete (post)
where
  Charting._placement (item: post) has (chart)
then
  Charting.deleteItem (chart, item: post)
```

### ThreadTracker.DeletedPostLosesUpvotes

Authored path: `ThreadTracker.DeletedPostLosesUpvotes`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 95.

```reaction
when Posting.delete (post)
then
  Upvoting.clear (item: post)
```

### ThreadTracker.EditPost

Authored path: `ThreadTracker.EditPost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 86.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 107.

```reaction
when RequestBoundary.request (analysis, chart, citation, path: "/posts/edit", post, quote, requestId, session)
then
  Sessioning.current (session)
```

### ThreadTracker.EditPost#2

Authored path: `ThreadTracker.EditPost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 86.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 107.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.EditPost
where
  earlier, RequestBoundary.request (analysis, chart, citation, path: "/posts/edit", post, quote, requestId, session)
then
  Charting.checkMember (chart, user)
```

### ThreadTracker.EditPost#3

Authored path: `ThreadTracker.EditPost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 86.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 107.

```reaction
when Charting.checkMember (chart, user), asked by ThreadTracker.EditPost#2
where
  earlier, RequestBoundary.request (analysis, chart, citation, path: "/posts/edit", post, quote, requestId, session)
then
  Posting.edit (analysis, author: user, citation, post, quote)
```

### ThreadTracker.EditPost#4

Authored path: `ThreadTracker.EditPost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 86.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 107.

```reaction
when Posting.edit (analysis, author: user, citation, post, quote), asked by ThreadTracker.EditPost#3
where
  earlier, RequestBoundary.request (analysis, chart, citation, path: "/posts/edit", post, quote, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### ThreadTracker.ExportChart

Authored path: `ThreadTracker.ExportChart`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 68.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 73.

```reaction
when RequestBoundary.request (chart, path: "/charts/export", requestId, session)
then
  Sessioning.current (session)
```

### ThreadTracker.ExportChart#2

Authored path: `ThreadTracker.ExportChart`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 68.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 73.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.ExportChart
where
  earlier, RequestBoundary.request (chart, path: "/charts/export", requestId, session)
then
  Charting.checkMember (chart, user)
```

### ThreadTracker.ExportChart#3

Authored path: `ThreadTracker.ExportChart`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 68.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 73.

```reaction
when Charting.checkMember (chart, user), asked by ThreadTracker.ExportChart#2
where
  earlier, RequestBoundary.request (chart, path: "/charts/export", requestId, session)
then
  RequestBoundary.respond (requestId, view: former "the chart (chart) as seen by (user)" with (chart, user))
```

### ThreadTracker.ListCharts

Authored path: `ThreadTracker.ListCharts`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 23.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 27.

```reaction
when RequestBoundary.request (path: "/charts/list", requestId, session)
then
  Sessioning.current (session)
```

### ThreadTracker.ListCharts#2

Authored path: `ThreadTracker.ListCharts`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 23.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 27.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.ListCharts
where
  earlier, RequestBoundary.request (path: "/charts/list", requestId, session)
then
  RequestBoundary.respond (charts: former "the charts of (user)" with (user), requestId)
```

### ThreadTracker.RejectUnknownMember

Authored path: `ThreadTracker.RejectUnknownMember`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 14.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 20.

```reaction
when RequestBoundary.request (chart, path: "/charts/add-member", requestId, session, username)
where
  Authenticating._registered (username) has (registered: false)
then
  Sessioning.current (session)
```

### ThreadTracker.RejectUnknownMember#2

Authored path: `ThreadTracker.RejectUnknownMember`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 14.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 20.

```reaction
when Sessioning.current (session), asked by ThreadTracker.RejectUnknownMember
where
  earlier, RequestBoundary.request (chart, path: "/charts/add-member", requestId, session, username)
then
  RequestBoundary.respond (error: "UNKNOWN_USER", requestId)
```

### ThreadTracker.UnvotePost

Authored path: `ThreadTracker.UnvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 118.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 124.

```reaction
when RequestBoundary.request (chart, path: "/posts/unvote", post, requestId, session)
then
  Sessioning.current (session)
```

### ThreadTracker.UnvotePost#2

Authored path: `ThreadTracker.UnvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 118.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 124.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.UnvotePost
where
  earlier, RequestBoundary.request (chart, path: "/posts/unvote", post, requestId, session)
then
  Charting.checkMember (chart, user)
```

### ThreadTracker.UnvotePost#3

Authored path: `ThreadTracker.UnvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 118.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 124.

```reaction
when Charting.checkMember (chart, user), asked by ThreadTracker.UnvotePost#2
where
  earlier, RequestBoundary.request (chart, path: "/posts/unvote", post, requestId, session)
then
  Charting.checkItem (chart, item: post)
```

### ThreadTracker.UnvotePost#4

Authored path: `ThreadTracker.UnvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 118.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 124.

```reaction
when Charting.checkItem (chart, item: post), asked by ThreadTracker.UnvotePost#3
where
  earlier, Sessioning.current (session, subject: user), asked by ThreadTracker.UnvotePost
then
  Upvoting.unvote (item: post, voter: user)
```

### ThreadTracker.UnvotePost#5

Authored path: `ThreadTracker.UnvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 118.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 124.

```reaction
when Upvoting.unvote (item: post, voter: user), asked by ThreadTracker.UnvotePost#4
where
  earlier, RequestBoundary.request (chart, path: "/posts/unvote", post, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### ThreadTracker.UpdateProgress

Authored path: `ThreadTracker.UpdateProgress`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 39.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 44.

```reaction
when RequestBoundary.request (chart, path: "/charts/progress", requestId, row, session)
then
  Sessioning.current (session)
```

### ThreadTracker.UpdateProgress#2

Authored path: `ThreadTracker.UpdateProgress`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 39.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 44.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.UpdateProgress
where
  earlier, RequestBoundary.request (chart, path: "/charts/progress", requestId, row, session)
then
  Charting.checkMember (chart, user)
```

### ThreadTracker.UpdateProgress#3

Authored path: `ThreadTracker.UpdateProgress`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 39.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 44.

```reaction
when Charting.checkMember (chart, user), asked by ThreadTracker.UpdateProgress#2
where
  earlier, RequestBoundary.request (chart, path: "/charts/progress", requestId, row, session)
then
  Charting.checkRow (chart, row)
```

### ThreadTracker.UpdateProgress#4

Authored path: `ThreadTracker.UpdateProgress`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 39.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 44.

```reaction
when Charting.checkRow (chart, row, index), asked by ThreadTracker.UpdateProgress#3
where
  earlier, Sessioning.current (session, subject: user), asked by ThreadTracker.UpdateProgress
then
  Progressing.setProgress (context: chart, reached: index, user)
```

### ThreadTracker.UpdateProgress#5

Authored path: `ThreadTracker.UpdateProgress`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 39.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 44.

```reaction
when Progressing.setProgress (context: chart, reached: index, user), asked by ThreadTracker.UpdateProgress#4
where
  earlier, RequestBoundary.request (chart, path: "/charts/progress", requestId, row, session)
then
  RequestBoundary.respond (reached: index, requestId)
```

### ThreadTracker.UpvotePost

Authored path: `ThreadTracker.UpvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 114.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 123.

```reaction
when RequestBoundary.request (chart, path: "/posts/upvote", post, requestId, session)
then
  Sessioning.current (session)
```

### ThreadTracker.UpvotePost#2

Authored path: `ThreadTracker.UpvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 114.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 123.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.UpvotePost
where
  earlier, RequestBoundary.request (chart, path: "/posts/upvote", post, requestId, session)
then
  Charting.checkMember (chart, user)
```

### ThreadTracker.UpvotePost#3

Authored path: `ThreadTracker.UpvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 114.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 123.

```reaction
when Charting.checkMember (chart, user), asked by ThreadTracker.UpvotePost#2
where
  earlier, RequestBoundary.request (chart, path: "/posts/upvote", post, requestId, session)
then
  Charting.checkItem (chart, item: post)
```

### ThreadTracker.UpvotePost#4

Authored path: `ThreadTracker.UpvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 114.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 123.

```reaction
when Charting.checkItem (chart, item: post, index), asked by ThreadTracker.UpvotePost#3
where
  earlier, Sessioning.current (session, subject: user), asked by ThreadTracker.UpvotePost
then
  Progressing.checkReached (context: chart, step: index, user)
```

### ThreadTracker.UpvotePost#5

Authored path: `ThreadTracker.UpvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 114.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 123.

```reaction
when Progressing.checkReached (context: chart, step: index, user), asked by ThreadTracker.UpvotePost#4
where
  earlier, Charting.checkItem (chart, item: post, index), asked by ThreadTracker.UpvotePost#3
then
  Upvoting.upvote (item: post, voter: user)
```

### ThreadTracker.UpvotePost#6

Authored path: `ThreadTracker.UpvotePost`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 114.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 123.

```reaction
when Upvoting.upvote (item: post, voter: user), asked by ThreadTracker.UpvotePost#5
where
  earlier, RequestBoundary.request (chart, path: "/posts/upvote", post, requestId, session)
then
  RequestBoundary.respond (post, requestId)
```

### ThreadTracker.ViewChart

Authored path: `ThreadTracker.ViewChart`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 49.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 63.

```reaction
when RequestBoundary.request (chart, path: "/charts/view", requestId, session)
then
  Sessioning.current (session)
```

### ThreadTracker.ViewChart#2

Authored path: `ThreadTracker.ViewChart`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 49.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 63.

```reaction
when Sessioning.current (session, subject: user), asked by ThreadTracker.ViewChart
where
  earlier, RequestBoundary.request (chart, path: "/charts/view", requestId, session)
then
  Charting.checkMember (chart, user)
```

### ThreadTracker.ViewChart#3

Authored path: `ThreadTracker.ViewChart`.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 49.
- Covered by [ThreadTracker](../design/compositions/ThreadTracker.md), line 63.

```reaction
when Charting.checkMember (chart, user), asked by ThreadTracker.ViewChart#2
where
  earlier, RequestBoundary.request (chart, path: "/charts/view", requestId, session)
then
  RequestBoundary.respond (requestId, view: former "the chart (chart) as seen by (user)" with (chart, user))
```

## Endpoint input contracts

Before recording an action ask, the boundary rejects a body that is not an
object or lacks a required key. The response uses `INVALID_INPUT` and names
the path or missing key. A declared default fills an absent key. Endpoints
not listed here have no explicit input contract.

- `/auth/current` — requires `session`
- `/auth/register` — requires `username`, `password`
- `/auth/sign-in` — requires `username`, `password`
- `/auth/sign-out` — requires `session`
- `/charts/add-column` — requires `session`, `chart`, `label`
- `/charts/add-member` — requires `session`, `chart`, `username`
- `/charts/create` — requires `session`, `title`, `rowLabels`, `columnLabels`
- `/charts/export` — requires `session`, `chart`
- `/charts/list` — requires `session`
- `/charts/progress` — requires `session`, `chart`, `row`
- `/charts/view` — requires `session`, `chart`
- `/posts/comment` — requires `session`, `chart`, `commentOn`; fills `analysis` with "" when absent; fills `citation` with "" when absent; fills `quote` with "" when absent
- `/posts/create` — requires `session`, `chart`, `row`, `column`; fills `analysis` with "" when absent; fills `citation` with "" when absent; fills `quote` with "" when absent
- `/posts/delete` — requires `session`, `chart`, `post`
- `/posts/delete-comment` — requires `session`, `chart`, `comment`
- `/posts/edit` — requires `session`, `chart`, `post`; fills `analysis` with "" when absent; fills `citation` with "" when absent; fills `quote` with "" when absent
- `/posts/unvote` — requires `session`, `chart`, `post`
- `/posts/upvote` — requires `session`, `chart`, `post`
