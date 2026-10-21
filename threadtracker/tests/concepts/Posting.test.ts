import { beforeEach, describe, expect, test } from "bun:test";
import {
  EmptyPost,
  NotAuthor,
  PostingConcept,
  PostNotFound,
  QuoteNeedsCitation,
} from "../../src/concepts/Posting.ts";
import { clear, testDb } from "../testDb.ts";

const db = testDb("posting");
const posting = new PostingConcept(db);

beforeEach(() => clear(db));

const idea = { quote: "And now you are free.", citation: "Ch. 3, p. 32", analysis: "Charles turns on Adam." };

describe("Posting", () => {
  test("principle: posts hold a quote and citation, an analysis, or both, with comments listed oldest first", async () => {
    const { post } = await posting.create({ author: "millie", ...idea });
    expect(await posting._get({ post })).toEqual([{ author: "millie", ...idea }]);

    const first = await posting.comment({ author: "cal", commentOn: post, analysis: "Like Cain." });
    const second = await posting.comment({ author: "aron", commentOn: post, analysis: "And Abel." });
    expect(await posting._comments({ post })).toEqual([
      { comment: first.post, author: "cal", quote: null, citation: null, analysis: "Like Cain." },
      { comment: second.post, author: "aron", quote: null, citation: null, analysis: "And Abel." },
    ]);

    await posting.delete({ post, author: "millie" });
    expect(await posting._get({ post })).toEqual([]);
    expect(await posting._get({ post: first.post })).toEqual([]);
  });

  test("accepts a quote and citation without analysis, and analysis alone", async () => {
    const quoteOnly = await posting.create({ author: "millie", quote: "Timshel", citation: "Ch. 24" });
    expect(await posting._get({ post: quoteOnly.post })).toEqual([
      { author: "millie", quote: "Timshel", citation: "Ch. 24", analysis: null },
    ]);
    const analysisOnly = await posting.create({ author: "millie", analysis: "Free will matters." });
    expect(await posting._get({ post: analysisOnly.post })).toEqual([
      { author: "millie", quote: null, citation: null, analysis: "Free will matters." },
    ]);
  });

  test("refuses a quote without a citation, and a citation without a quote", async () => {
    await expect(posting.create({ author: "millie", quote: "Timshel" })).rejects.toThrow(QuoteNeedsCitation);
    await expect(posting.create({ author: "millie", citation: "Ch. 24", analysis: "x" })).rejects.toThrow(
      QuoteNeedsCitation,
    );
  });

  test("refuses an empty post, treating blank fields as empty", async () => {
    await expect(posting.create({ author: "millie" })).rejects.toThrow(EmptyPost);
    await expect(posting.create({ author: "millie", quote: "", citation: "", analysis: "   " })).rejects.toThrow(
      EmptyPost,
    );
  });

  test("applies the same content rules to comments", async () => {
    const { post } = await posting.create({ author: "millie", ...idea });
    await expect(posting.comment({ author: "cal", commentOn: post })).rejects.toThrow(EmptyPost);
    await expect(posting.comment({ author: "cal", commentOn: post, quote: "x" })).rejects.toThrow(
      QuoteNeedsCitation,
    );
  });

  test("refuses a comment on a post that does not exist", async () => {
    await expect(posting.comment({ author: "cal", commentOn: "missing", analysis: "x" })).rejects.toThrow(
      PostNotFound,
    );
  });

  test("lets only the author edit, and replaces the content", async () => {
    const { post } = await posting.create({ author: "millie", ...idea });
    await expect(posting.edit({ post, author: "cal", analysis: "Mine now." })).rejects.toThrow(NotAuthor);

    await posting.edit({ post, author: "millie", analysis: "Revised." });
    expect(await posting._get({ post })).toEqual([
      { author: "millie", quote: null, citation: null, analysis: "Revised." },
    ]);
  });

  test("refuses an edit that breaks the content rules", async () => {
    const { post } = await posting.create({ author: "millie", ...idea });
    await expect(posting.edit({ post, author: "millie", quote: "x" })).rejects.toThrow(QuoteNeedsCitation);
    await expect(posting.edit({ post, author: "millie" })).rejects.toThrow(EmptyPost);
  });

  test("lets only the author delete", async () => {
    const { post } = await posting.create({ author: "millie", ...idea });
    await expect(posting.delete({ post, author: "cal" })).rejects.toThrow(NotAuthor);
    expect(await posting._get({ post })).toHaveLength(1);
  });

  test("deleting a post removes replies to its comments too", async () => {
    const { post } = await posting.create({ author: "millie", ...idea });
    const comment = await posting.comment({ author: "cal", commentOn: post, analysis: "Reply." });
    const reply = await posting.comment({ author: "millie", commentOn: comment.post, analysis: "Reply to reply." });
    await posting.delete({ post, author: "millie" });
    expect(await posting._get({ post: reply.post })).toEqual([]);
  });

  test("deleting a comment leaves its post", async () => {
    const { post } = await posting.create({ author: "millie", ...idea });
    const comment = await posting.comment({ author: "cal", commentOn: post, analysis: "Reply." });
    await posting.delete({ post: comment.post, author: "cal" });
    expect(await posting._get({ post })).toHaveLength(1);
    expect(await posting._comments({ post })).toEqual([]);
  });

  test("refuses editing or deleting a post that does not exist", async () => {
    await expect(posting.edit({ post: "missing", author: "millie", analysis: "x" })).rejects.toThrow(PostNotFound);
    await expect(posting.delete({ post: "missing", author: "millie" })).rejects.toThrow(PostNotFound);
  });

  test("_thread lists a post and every reply under it, oldest first", async () => {
    const { post } = await posting.create({ author: "millie", ...idea });
    const comment = await posting.comment({ author: "cal", commentOn: post, analysis: "Reply." });
    const reply = await posting.comment({ author: "millie", commentOn: comment.post, analysis: "Reply to reply." });
    const other = await posting.create({ author: "cal", analysis: "Unrelated." });
    expect(await posting._thread({ post })).toEqual([{ post }, { post: comment.post }, { post: reply.post }]);
    expect(await posting._thread({ post: other.post })).toEqual([{ post: other.post }]);
    expect(await posting._thread({ post: "missing" })).toEqual([]);
  });

});
