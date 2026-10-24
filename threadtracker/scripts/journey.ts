/**
 * Runs the core user journey end to end and checks every outcome.
 *
 *   bun scripts/journey.ts
 *
 * It assembles the real application (concepts, reactions, views, formers) over a
 * fresh `threadtracker_journey` database and drives it through the same
 * endpoints the frontend calls, using sync-engine's local client. Unlike the
 * browser, the local client returns exact refusal codes (NOT_REACHED, not just
 * FORBIDDEN), so access control is checked precisely. The app's own database
 * is never touched. Exits with code 1 on the first failed check.
 */
import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createLocalClient } from "@mit-sdg/sync-engine/client";
import { MongoClient } from "mongodb";
import type { ThreadTrackerWire } from "../generated/wire.ts";
import { assembleApplication } from "../src/assembly.ts";

const mongo = new MongoClient(process.env.MONGODB_URL!);
const db = mongo.db("threadtracker_journey");
await db.dropDatabase();
const api = createLocalClient<ThreadTrackerWire>({
  invoker: createGateway({ application: assembleApplication(db) }),
});

let checks = 0;
function check(condition: boolean, description: string, detail?: unknown): void {
  checks++;
  if (!condition) {
    console.error(`  ✗ ${description}`);
    if (detail !== undefined) console.error("    got:", JSON.stringify(detail));
    process.exit(1);
  }
  console.log(`  ✓ ${description}`);
}

/** Unwraps a successful answer, or fails the journey with the error. */
function ok<T>(result: T, step: string): Exclude<T, { error: unknown }> {
  if (typeof result === "object" && result !== null && "error" in result) {
    console.error(`  ✗ ${step} failed with ${String(result.error)}`);
    process.exit(1);
  }
  return result as Exclude<T, { error: unknown }>;
}

function refused(result: unknown, code: string): boolean {
  return typeof result === "object" && result !== null && "error" in result && result.error === code;
}

async function signUp(username: string) {
  const { session } = ok(await api.auth.register({ username, password: "timshel123" }), `register ${username}`);
  return String(session);
}

async function view(session: string, chart: string) {
  return ok(await api.charts.view({ session, chart }), "view chart").view;
}

// ---------------------------------------------------------------------------
console.log("(0) Setting up, from an empty database");

const teacher = await signUp("teacher");
const millie = await signUp("millie");
const classmate = await signUp("classmate");
const outsider = await signUp("outsider");
check(
  refused(await api.auth.register({ username: "millie", password: "timshel123" }), "USERNAME_TAKEN"),
  "a username can be registered only once",
);

const chapters = ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5"];
const elements = ["free will", "sibling rivalry", "Cain and Abel"];
check(
  refused(
    await api.charts.create({ session: teacher, title: "x", rowLabels: ["Chapter 1", "Chapter 1"], columnLabels: elements }),
    "DUPLICATE_ROW",
  ),
  "a chart with two rows of the same label is refused",
);
check(
  refused(
    await api.charts.create({ session: teacher, title: "x", rowLabels: chapters, columnLabels: ["a", "a"] }),
    "DUPLICATE_COLUMN",
  ),
  "a chart with two columns of the same label is refused",
);
const { chart } = ok(
  await api.charts.create({ session: teacher, title: "East of Eden", rowLabels: chapters, columnLabels: elements }),
  "create chart",
);
const chartId = String(chart);

ok(await api.charts["add-member"]({ session: teacher, chart: chartId, username: "millie" }), "add millie");
ok(await api.charts["add-member"]({ session: teacher, chart: chartId, username: "classmate" }), "add classmate");
check(
  refused(await api.charts["add-member"]({ session: teacher, chart: chartId, username: "nobody" }), "UNKNOWN_USER"),
  "adding an unregistered username is refused",
);
check(
  refused(await api.charts["add-member"]({ session: teacher, chart: chartId, username: "millie" }), "ALREADY_MEMBER"),
  "adding a member twice is refused",
);
check(
  refused(await api.charts["add-member"]({ session: millie, chart: chartId, username: "outsider" }), "NOT_OWNER"),
  "only the owner can add members",
);

const millieCharts = ok(await api.charts.list({ session: millie }), "list charts").charts;
check(
  millieCharts.length === 1 && millieCharts[0]!.title === "East of Eden",
  "Millie sees the chart in her list",
  millieCharts,
);

let millieView = await view(millie, chartId);
check(millieView.reached === 0 && millieView.posts.length === 0, "before marking progress, Millie has reached nothing");
check(
  millieView.rows.length === 0 && millieView.unreadRows.length === 5,
  "every chapter is unread, sent by position only, with no titles",
  millieView,
);
const row = Object.fromEntries(millieView.unreadRows.map((r) => [r.index, String(r.row)]));
const column = Object.fromEntries(millieView.columns.map((c) => [c.label, String(c.column)]));

// ---------------------------------------------------------------------------
console.log("(1) Reading and marking progress");

check(
  refused(
    await api.posts.create({ session: millie, chart: chartId, row: row[1]!, column: column["free will"]!, analysis: "x" }),
    "NOT_REACHED",
  ),
  "Millie cannot post before marking progress",
);
ok(await api.charts.progress({ session: millie, chart: chartId, row: row[3]! }), "Millie marks Chapter 3");
ok(await api.charts.progress({ session: classmate, chart: chartId, row: row[5]! }), "classmate marks Chapter 5");
ok(await api.charts.progress({ session: teacher, chart: chartId, row: row[5]! }), "teacher marks Chapter 5");
millieView = await view(millie, chartId);
check(millieView.reached === 3, "Millie's progress is Chapter 3");

// ---------------------------------------------------------------------------
console.log("(2) Posting an idea");

const millieIdea = ok(
  await api.posts.create({
    session: millie,
    chart: chartId,
    row: row[3]!,
    column: column["sibling rivalry"]!,
    quote: "And now you are free.",
    citation: "Chapter 3",
    analysis: "Charles turns on Adam after their father rejects his gift.",
  }),
  "Millie posts in Chapter 3 / sibling rivalry",
).post;
check(
  refused(
    await api.posts.create({ session: millie, chart: chartId, row: row[3]!, column: column["free will"]!, quote: "x" }),
    "QUOTE_NEEDS_CITATION",
  ),
  "a quote without a citation is refused",
);
check(
  refused(
    await api.posts.create({ session: millie, chart: chartId, row: row[3]!, column: column["free will"]! }),
    "EMPTY_POST",
  ),
  "an empty post is refused",
);
check(
  refused(
    await api.posts.create({ session: millie, chart: chartId, row: row[4]!, column: column["free will"]!, analysis: "x" }),
    "NOT_REACHED",
  ),
  "Millie cannot post in Chapter 4, which she has not reached",
);

// ---------------------------------------------------------------------------
console.log("(3) Revisiting earlier events");

const etymology = ok(
  await api.posts.create({
    session: classmate,
    chart: chartId,
    row: row[2]!,
    column: column["Cain and Abel"]!,
    analysis: "Adam's name means 'man': he stands for everyone, as Abel and Cain do.",
  }),
  "the classmate posts the etymology idea in an earlier row",
).post;
const spoiler = ok(
  await api.posts.create({
    session: classmate,
    chart: chartId,
    row: row[5]!,
    column: column["free will"]!,
    quote: "Timshel",
    citation: "Chapter 5",
    analysis: "Thou mayest.",
  }),
  "the classmate posts in Chapter 5",
).post;

ok(await api.posts.upvote({ session: millie, chart: chartId, post: etymology }), "Millie upvotes the etymology post");
check(
  refused(await api.posts.upvote({ session: millie, chart: chartId, post: etymology }), "ALREADY_UPVOTED"),
  "a second upvote is refused",
);
check(
  refused(await api.posts.upvote({ session: millie, chart: chartId, post: spoiler }), "NOT_REACHED"),
  "Millie cannot upvote a post in a chapter she has not reached",
);
const millieComment = ok(
  await api.posts.comment({
    session: millie,
    chart: chartId,
    commentOn: etymology,
    analysis: "This ties to Charles turning on Adam in Chapter 3.",
  }),
  "Millie comments on the etymology post",
).comment;
check(
  refused(
    await api.posts.comment({ session: millie, chart: chartId, commentOn: spoiler, analysis: "x" }),
    "NOT_REACHED",
  ),
  "Millie cannot comment on a post in a chapter she has not reached",
);

millieView = await view(millie, chartId);
const etymologyCard = millieView.posts.find((p) => p.post === etymology)?.card;
check(
  etymologyCard?.upvotes === 1 && etymologyCard.upvoted === true,
  "the etymology post shows one upvote, Millie's",
  etymologyCard,
);
check(
  etymologyCard?.comments.length === 1 && etymologyCard.comments[0]!.author === "millie",
  "Millie's comment appears under the post, with her username",
  etymologyCard?.comments,
);
check(!millieView.posts.some((p) => p.post === spoiler), "the Chapter 5 post is hidden from Millie");

check(
  refused(
    await api.posts.edit({ session: classmate, chart: chartId, post: millieIdea, analysis: "mine" }),
    "NOT_AUTHOR",
  ),
  "the classmate cannot edit Millie's post",
);
ok(
  await api.posts.edit({
    session: millie,
    chart: chartId,
    post: millieIdea,
    quote: "And now you are free.",
    citation: "Chapter 3",
    analysis: "Charles turns on Adam, echoing Cain.",
  }),
  "Millie edits her post",
);
ok(await api.posts.unvote({ session: millie, chart: chartId, post: etymology }), "Millie removes her upvote");
ok(await api.posts["delete-comment"]({ session: millie, chart: chartId, comment: millieComment }), "Millie deletes her comment");
millieView = await view(millie, chartId);
const etymologyAfter = millieView.posts.find((p) => p.post === etymology)?.card;
check(
  etymologyAfter?.upvotes === 0 && etymologyAfter.comments.length === 0,
  "the upvote and comment are gone, and the post stays",
  etymologyAfter,
);
ok(await api.charts["add-column"]({ session: classmate, chart: chartId, label: "names" }), "the classmate adds a column");
check(
  refused(await api.charts["add-column"]({ session: millie, chart: chartId, label: "names" }), "DUPLICATE_COLUMN"),
  "adding a column label twice is refused",
);

// ---------------------------------------------------------------------------
console.log("(4) Falling behind");

ok(await api.charts.progress({ session: millie, chart: chartId, row: row[2]! }), "Millie moves back to Chapter 2");
millieView = await view(millie, chartId);
check(
  millieView.posts.every((p) => p.index <= 2) && !millieView.posts.some((p) => p.post === millieIdea),
  "rows after Chapter 2, including her own Chapter 3 post, are hidden again",
  millieView.posts.map((p) => p.index),
);
ok(
  await api.posts.create({ session: millie, chart: chartId, row: row[2]!, column: column["free will"]!, analysis: "Adam chooses." }),
  "Millie can still post in Chapter 2",
);
ok(await api.charts.progress({ session: millie, chart: chartId, row: row[3]! }), "Millie returns to Chapter 3");

// ---------------------------------------------------------------------------
console.log("(5) Filtering and exporting");

const exported = ok(await api.charts.export({ session: millie, chart: chartId }), "Millie exports").view;
const chosen = new Set(["sibling rivalry", "Cain and Abel"].map((label) => column[label]));
const filtered = exported.posts.filter((p) => chosen.has(String(p.column)));
check(
  filtered.map((p) => p.post).join() === [etymology, millieIdea].join(),
  "filtered to two columns, the export lists the etymology idea (Ch. 2) then Millie's (Ch. 3)",
  filtered.map((p) => [p.index, p.card.analysis]),
);
check(
  exported.posts.every((p, i, all) => i === 0 || all[i - 1]!.index <= p.index),
  "the export is in chapter order",
);
check(exported.posts.every((p) => p.index <= 3), "the export includes nothing past Chapter 3");
check(
  filtered.every((p) => p.card.quote === null || p.card.citation !== null),
  "every quote in the export has its citation",
);
const classmateExport = ok(await api.charts.export({ session: classmate, chart: chartId }), "classmate exports").view;
check(classmateExport.posts.some((p) => p.post === spoiler), "the classmate's export includes Chapter 5");

// ---------------------------------------------------------------------------
console.log("Deleting a post cleans up after it");

const doomed = ok(
  await api.posts.create({
    session: classmate,
    chart: chartId,
    row: row[2]!,
    column: column["free will"]!,
    analysis: "A post that will be deleted.",
  }),
  "the classmate posts an idea",
).post;
ok(await api.posts.upvote({ session: millie, chart: chartId, post: doomed }), "Millie upvotes it");
ok(await api.posts.delete({ session: classmate, chart: chartId, post: doomed }), "the classmate deletes it");

const afterDelete = ok(await api.charts.view({ session: millie, chart: chartId }), "Millie views the chart").view;
check(
  !afterDelete.posts.some((p) => p.post === doomed),
  "the deleted post is no longer in its cell",
);
check(
  (await db.collection("upvoting.upvotes").countDocuments({ item: doomed })) === 0,
  "the deleted post's upvotes are cleared",
);

// ---------------------------------------------------------------------------
console.log("Access control");

check(
  refused(await api.charts.view({ session: outsider, chart: chartId }), "NOT_MEMBER"),
  "a non-member cannot view the chart",
);
check(
  refused(
    await api.posts.create({ session: outsider, chart: chartId, row: row[1]!, column: column["free will"]!, analysis: "x" }),
    "NOT_MEMBER",
  ),
  "a non-member cannot post, even by calling the endpoint directly",
);
check(
  refused(await api.charts.view({ session: "invented", chart: chartId }), "UNKNOWN_SESSION"),
  "a request without a valid session is refused",
);
ok(await api.auth["sign-out"]({ session: millie }), "Millie signs out");
check(
  refused(await api.charts.view({ session: millie, chart: chartId }), "UNKNOWN_SESSION"),
  "after signing out, Millie's old session no longer works",
);

// ---------------------------------------------------------------------------
console.log("Persistence");

const restarted = createLocalClient<ThreadTrackerWire>({
  invoker: createGateway({ application: assembleApplication(db) }),
});
const again = ok(await restarted.auth["sign-in"]({ username: "millie", password: "timshel123" }), "sign in after restart");
const restartedView = ok(await restarted.charts.view({ session: String(again.session), chart: chartId }), "view after restart").view;
check(
  restartedView.reached === 3 && restartedView.posts.some((p) => p.post === millieIdea),
  "after rebuilding the app over the same database, Millie's account, progress, and posts are all there",
);

await db.dropDatabase();
await mongo.close();
console.log(`\nJourney passed: ${checks} checks.`);