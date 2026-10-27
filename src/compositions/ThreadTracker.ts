/**
 * ThreadTracker: charts of a book's chapters (rows) by literary element
 * (columns), with posts in cells, gated by each reader's progress.
 *
 * Every endpoint first resolves the session cookie to the current account, so a
 * caller never chooses who they act as. Each gate is a concept action that
 * either returns or refuses with a code, so a request that fails a gate gets an
 * error answer instead of hanging:
 *
 *   checkMember  the caller belongs to the chart
 *   checkRow     the row is in the chart; returns its index (chapter number)
 *   checkCell    the row and column are in the chart; returns the row's index
 *   checkOwner   the caller owns the chart
 *   checkItem    the post is placed in the chart; returns its row's index
 *   checkReached the caller's progress has reached that index
 *
 * All gates run before anything changes state, so a refusal never leaves a
 * half-finished change behind.
 */
import { endpoint, receive, respond } from "@mit-sdg/sync-engine/boundary";
import { each, form, former, is, view, where, reaction, when } from "@mit-sdg/sync-engine/language";
import { concepts } from "../concepts.ts";

const { Authenticating, Charting, Posting, Progressing, Sessioning, Upvoting } = concepts;

// ---------------------------------------------------------------------------
// View and formers
// ---------------------------------------------------------------------------

/** A row index counts as reached when it is at most the user's progress in the chart. */
const RowReached = view(
  "row (index) is reached by (user) in (chart)",
  ({ index, user, chart }, _outputs, { reached }) =>
    where(Progressing._reached({ user, context: chart }).is({ reached }), is.le(index, reached)),
).holds();

/** Every chart the user is a member of, oldest first. */
const ChartList = former("the charts of (user)", ({ user }, { chart, title, owner }) =>
  each(Charting._chartsFor({ user }).is({ chart, title, owner })).form({ chart, title, owner }),
);

/** One post as the viewer sees it: content, upvotes, and comments oldest first. */
const PostCard = former(
  "(post) as seen by (user)",
  (
    { post, user },
    { author, quote, citation, analysis, count, result, comment, commentAuthor, commentQuote, commentCitation, commentAnalysis },
  ) =>
    where(
      Posting._get({ post }).is({ author, quote, citation, analysis }),
      Upvoting._count({ item: post }).is({ count }),
      Upvoting._hasUpvoted({ voter: user, item: post }).is({ result }),
    ).form({
      author,
      quote,
      citation,
      analysis,
      upvotes: count,
      upvoted: result,
      comments: each(
        Posting._comments({ post }).is({
          comment,
          author: commentAuthor,
          quote: commentQuote,
          citation: commentCitation,
          analysis: commentAnalysis,
        }),
      ).form({
        comment,
        author: commentAuthor,
        quote: commentQuote,
        citation: commentCitation,
        analysis: commentAnalysis,
      }),
    }),
);

/**
 * The chart as one member sees it, including who the other members are. Only
 * members can request it, so a chart's members are never shown to outsiders.
 * Every row label is included, for the
 * progress dropdown, but only posts in rows the member has reached are sent,
 * so unread chapters never reach the browser. Posts come in chapter order, then
 * oldest first within a chapter, which is also the export's order.
 */
const ChartView = former(
  "the chart (chart) as seen by (user)",
  (
    { chart, user },
    { title, owner, reached, member, row, label, index, unreadRow, unreadIndex, column, columnLabel, post, postRow, postIndex, postColumn },  ) =>
    where(
      Charting._get({ chart }).is({ title, owner }),
      Progressing._reached({ user, context: chart }).is({ reached }),
    ).form({
      chart,
      title,
      owner,
      reached,
      members: each(Charting._members({ chart }).is({ member })).form({ member }),
      rows: each(Charting._rows({ chart }).is({ row, label, index }))
        .where(RowReached({ index, user, chart }))
        .form({ row, label, index }),
      unreadRows: each(Charting._rows({ chart }).is({ row: unreadRow, index: unreadIndex }))
        .where(is.gt(unreadIndex, reached))
        .form({ row: unreadRow, index: unreadIndex }),      
      columns: each(Charting._columns({ chart }).is({ column, label: columnLabel })).form({
        column,
        label: columnLabel,
      }),
      posts: each(
        Charting._items({ chart }).is({ item: post, row: postRow, index: postIndex, column: postColumn }),
      )
        .where(RowReached({ index: postIndex, user, chart }))
        .form({ post, row: postRow, index: postIndex, column: postColumn, card: PostCard({ post, user }) }),
    }),
);

// ---------------------------------------------------------------------------
// Setting up a chart
// ---------------------------------------------------------------------------

const CreateChart = endpoint(
  "/charts/create",
  ({ session, user, title, rowLabels, columnLabels, chart }) =>
    receive({ session, title, rowLabels, columnLabels })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.createChart({ title, owner: user, rowLabels, columnLabels }).responds({ chart }))
      .then(respond({ chart })),
  { input: { required: ["session", "title", "rowLabels", "columnLabels"] } },
);

// Adding a member has two endpoints on one path: one for a registered username,
// and one that answers UNKNOWN_USER. Exactly one of them matches each request.
// Both refuse anyone but the owner first, so a non-owner can't use this path to
// find out which usernames are registered.
const AddMember = endpoint(
  "/charts/add-member",
  ({ session, user, chart, username }) =>
    receive({ session, chart, username })
      .where(Authenticating._registered({ username }).is({ registered: true }))
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.addMember({ chart, owner: user, user: username }).responds({}))
      .then(respond({ member: username })),
  { input: { required: ["session", "chart", "username"] } },
);

const RejectUnknownMember = endpoint(
  "/charts/add-member",
  ({ session, user, chart, username }) =>
    receive({ session, chart, username })
      .where(Authenticating._registered({ username }).is({ registered: false }))
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkOwner({ chart, owner: user }).responds({}))
      .then(respond({ error: "UNKNOWN_USER" })),
  // The input contract for this path is declared once, on AddMember.
);

const ListCharts = endpoint(
  "/charts/list",
  ({ session, user }) =>
    receive({ session })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(respond({ charts: ChartList({ user }) })),
  { input: { required: ["session"] } },
);

const AddColumn = endpoint(
  "/charts/add-column",
  ({ session, user, chart, label, column }) =>
    receive({ session, chart, label })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.addColumn({ chart, label, user }).responds({ column }))
      .then(respond({ column })),
  { input: { required: ["session", "chart", "label"] } },
);

// ---------------------------------------------------------------------------
// Marking progress
// ---------------------------------------------------------------------------

const UpdateProgress = endpoint(
  "/charts/progress",
  ({ session, user, chart, row, index }) =>
    receive({ session, chart, row })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkMember({ chart, user }).responds({}))
      .then(Charting.checkRow({ row, chart }).responds({ index }))
      .then(Progressing.setProgress({ user, context: chart, reached: index }).responds({}))
      .then(respond({ reached: index })),
  { input: { required: ["session", "chart", "row"] } },
);

// ---------------------------------------------------------------------------
// Viewing and exporting
// ---------------------------------------------------------------------------

const ViewChart = endpoint(
  "/charts/view",
  ({ session, user, chart }) =>
    receive({ session, chart })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkMember({ chart, user }).responds({}))
      .then(respond({ view: ChartView({ chart, user }) })),
  { input: { required: ["session", "chart"] } },
);

// Export uses the same chart view, so it can never include an unreached row.
// The frontend limits it to the chosen columns and renders the PDF.
const ExportChart = endpoint(
  "/charts/export",
  ({ session, user, chart }) =>
    receive({ session, chart })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkMember({ chart, user }).responds({}))
      .then(respond({ view: ChartView({ chart, user }) })),
  { input: { required: ["session", "chart"] } },
);

// ---------------------------------------------------------------------------
// Posting and commenting
// ---------------------------------------------------------------------------

// An omitted quote, citation, or analysis defaults to "", which Posting treats as not given.
const CreatePost = endpoint(
  "/posts/create",
  ({ session, user, chart, row, column, quote, citation, analysis, index, post }) =>
    receive({ session, chart, row, column, quote, citation, analysis })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkMember({ chart, user }).responds({}))
      .then(Charting.checkCell({ chart, row, column }).responds({ index }))
      .then(Progressing.checkReached({ user, context: chart, step: index }).responds({}))
      .then(Posting.create({ author: user, quote, citation, analysis }).responds({ post }))
      .then(Charting.addItem({ item: post, chart, row, column, user }).responds({}))
      .then(respond({ post })),
  { input: { required: ["session", "chart", "row", "column"], defaults: { quote: "", citation: "", analysis: "" } } },
);

const CreateComment = endpoint(
  "/posts/comment",
  ({ session, user, chart, commentOn, quote, citation, analysis, index, comment }) =>
    receive({ session, chart, commentOn, quote, citation, analysis })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkMember({ chart, user }).responds({}))
      .then(Charting.checkItem({ item: commentOn, chart }).responds({ index }))
      .then(Progressing.checkReached({ user, context: chart, step: index }).responds({}))
      .then(Posting.comment({ author: user, commentOn, quote, citation, analysis }).responds({ post: comment }))
      .then(respond({ comment })),
  { input: { required: ["session", "chart", "commentOn"], defaults: { quote: "", citation: "", analysis: "" } } },
);

const EditPost = endpoint(
  "/posts/edit",
  ({ session, user, chart, post, quote, citation, analysis }) =>
    receive({ session, chart, post, quote, citation, analysis })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkMember({ chart, user }).responds({}))
      .then(Posting.edit({ post, author: user, quote, citation, analysis }).responds({}))
      .then(respond({ post })),
  { input: { required: ["session", "chart", "post"], defaults: { quote: "", citation: "", analysis: "" } } },
);

const DeletePost = endpoint(
  "/posts/delete",
  ({ session, user, chart, post }) =>
    receive({ session, chart, post })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkMember({ chart, user }).responds({}))
      .then(Charting.checkItem({ item: post, chart }).responds({}))
      .then(Posting.delete({ post, author: user }).responds({}))
      .then(respond({ post })),
  { input: { required: ["session", "chart", "post"] } },
);

const DeleteComment = endpoint(
  "/posts/delete-comment",
  ({ session, user, chart, comment }) =>
    receive({ session, chart, comment })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkMember({ chart, user }).responds({}))
      .then(Posting.delete({ post: comment, author: user }).responds({}))
      .then(respond({ comment })),
  { input: { required: ["session", "chart", "comment"] } },
);

// ---------------------------------------------------------------------------
// Upvoting
// ---------------------------------------------------------------------------

const UpvotePost = endpoint(
  "/posts/upvote",
  ({ session, user, chart, post, index }) =>
    receive({ session, chart, post })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkMember({ chart, user }).responds({}))
      .then(Charting.checkItem({ item: post, chart }).responds({ index }))
      .then(Progressing.checkReached({ user, context: chart, step: index }).responds({}))
      .then(Upvoting.upvote({ voter: user, item: post }).responds({}))
      .then(respond({ post })),
  { input: { required: ["session", "chart", "post"] } },
);

// No progress check: someone who moved their progress back can still take back an upvote.
const UnvotePost = endpoint(
  "/posts/unvote",
  ({ session, user, chart, post }) =>
    receive({ session, chart, post })
      .then(Sessioning.current({ session }).responds({ subject: user }))
      .then(Charting.checkMember({ chart, user }).responds({}))
      .then(Charting.checkItem({ item: post, chart }).responds({}))
      .then(Upvoting.unvote({ voter: user, item: post }).responds({}))
      .then(respond({ post })),
  { input: { required: ["session", "chart", "post"] } },
);

// Whenever a post is deleted, through any endpoint, its upvotes go with it.
const DeletedPostLosesUpvotes = reaction(({ post }) =>
  when(Posting.delete({ post }).responds({})).then(Upvoting.clear({ item: post })),
);

// Whenever a placed post is deleted, it leaves its cell. Comments are never placed, so they don't match.
const DeletedPostLeavesChart = reaction(({ post, chart }) =>
  when(Posting.delete({ post }).responds({}))
    .where(Charting._placement({ item: post }).is({ chart }))
    .then(Charting.deleteItem({ item: post, chart })),
);

export const composition = {
  RowReached,
  ChartList,
  PostCard,
  ChartView,
  CreateChart,
  AddMember,
  RejectUnknownMember,
  ListCharts,
  AddColumn,
  UpdateProgress,
  ViewChart,
  ExportChart,
  CreatePost,
  CreateComment,
  EditPost,
  DeletePost,
  DeleteComment,
  UpvotePost,
  UnvotePost,
  DeletedPostLosesUpvotes,
  DeletedPostLeavesChart,
};
