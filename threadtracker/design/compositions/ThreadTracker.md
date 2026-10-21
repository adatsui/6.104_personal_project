# ThreadTracker

Every chart request first resolves its session to the current account, so callers
cannot act as someone else. Each gate below is an action that refuses with a code,
so a request that fails a gate is answered with an informative error rather than
left unanswered.

## Setting up a chart

A signed-in account [creates a chart](reaction:ThreadTracker.CreateChart) with a
title, the book's chapters as rows, and literary elements as columns, and becomes
its owner and first member. The owner
[adds a member by username](reaction:ThreadTracker.AddMember) when that username
is registered; [an unregistered username is refused](reaction:ThreadTracker.RejectUnknownMember)
with `UNKNOWN_USER`.

```endpoints
ThreadTracker.CreateChart at /charts/create
ThreadTracker.AddMember at /charts/add-member
ThreadTracker.RejectUnknownMember at /charts/add-member
```

A signed-in account [lists its charts](reaction:ThreadTracker.ListCharts), using
the [chart list](former:ThreadTracker.ChartList) of every chart it is a member of.

```endpoints
ThreadTracker.ListCharts at /charts/list
```

Any member [adds a literary element](reaction:ThreadTracker.AddColumn) as a new
column at the end of the chart. A label the chart already has is refused.

```endpoints
ThreadTracker.AddColumn at /charts/add-column
```

## Marking progress

A member [marks the last chapter they have read](reaction:ThreadTracker.UpdateProgress).
Charting locates that row's index, which becomes the member's progress in the chart,
so progress can never point past the last chapter.

```endpoints
ThreadTracker.UpdateProgress at /charts/progress
```

## Viewing the chart

A member [views the chart](reaction:ThreadTracker.ViewChart) through the
[chart view](former:ThreadTracker.ChartView). The chart view includes the chart's
title, its columns, and only the rows whose index is at most the member's progress.
For each visible row, it includes the posts placed there with their column, author,
quote, citation, analysis, upvote count, and whether the member has upvoted them,
and each post's comments, oldest first. Posts in rows the member has not reached are
never sent to the front end. A post is included only when [its row is reached](view:ThreadTracker.RowReached) by
the member, and each included post is shown as a [post card](former:ThreadTracker.PostCard)
with its content, upvotes, and comments.

Filtering by literary element works on the chart view in the front end, so it needs
no endpoint of its own and never reveals unread rows.

```endpoints
ThreadTracker.ViewChart at /charts/view
```

## Exporting

A member [exports the chart](reaction:ThreadTracker.ExportChart) through the same
[chart view](former:ThreadTracker.ChartView), so an export includes only the rows the
member has reached. The front end renders it as a PDF in chapter order.

```endpoints
ThreadTracker.ExportChart at /charts/export
```

## Posting and commenting

A member [posts an idea](reaction:ThreadTracker.CreatePost) in a cell after Charting
confirms membership and that the cell is in the chart, and Progressing confirms the
member has reached that row. The new post is then placed in the cell.

A member [comments on a post](reaction:ThreadTracker.CreateComment) after Charting
locates the post's row and Progressing confirms the member has reached it. Comments
are not placed in the chart, so only top-level posts can be commented on.

The author of a post or comment [edits it](reaction:ThreadTracker.EditPost) after
Charting confirms membership. Posting refuses an edit by anyone else, and applies the
same rules as creating: a quote needs a citation, and a post cannot be empty.

The author of a post [deletes it](reaction:ThreadTracker.DeletePost) after Charting
confirms membership and that the post is in the chart. Posting deletes the post with
its comments, and Charting removes it from its cell.

The author of a comment [deletes the comment](reaction:ThreadTracker.DeleteComment)
after Charting confirms membership. A comment was never placed in the chart, so only
Posting changes.

```endpoints
ThreadTracker.CreatePost at /posts/create
ThreadTracker.CreateComment at /posts/comment
ThreadTracker.EditPost at /posts/edit
ThreadTracker.DeletePost at /posts/delete
ThreadTracker.DeleteComment at /posts/delete-comment
```

## Upvoting

A member [upvotes a post](reaction:ThreadTracker.UpvotePost) after Charting locates
the post's row and Progressing confirms the member has reached it. Only top-level
posts can be upvoted.

A member [removes their upvote](reaction:ThreadTracker.UnvotePost) after Charting
confirms membership and that the post is in the chart. Upvoting refuses when the
member has not upvoted the post.

```endpoints
ThreadTracker.UpvotePost at /posts/upvote
ThreadTracker.UnvotePost at /posts/unvote
```