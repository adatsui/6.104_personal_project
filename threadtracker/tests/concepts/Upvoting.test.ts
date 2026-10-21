import { beforeEach, describe, expect, test } from "bun:test";
import { AlreadyUpvoted, NotUpvoted, UpvotingConcept } from "../../src/concepts/Upvoting.ts";
import { clear, testDb } from "../testDb.ts";

const db = testDb("upvoting");
const upvoting = new UpvotingConcept(db);

beforeEach(() => clear(db));

describe("Upvoting", () => {
  test("principle: an upvote adds one, removing it subtracts one, and a user upvotes at most once", async () => {
    expect(await upvoting._count({ item: "post-1" })).toEqual({ count: 0 });

    await upvoting.upvote({ voter: "millie", item: "post-1" });
    expect(await upvoting._count({ item: "post-1" })).toEqual({ count: 1 });
    expect(await upvoting._hasUpvoted({ voter: "millie", item: "post-1" })).toEqual({ result: true });

    await expect(upvoting.upvote({ voter: "millie", item: "post-1" })).rejects.toThrow(AlreadyUpvoted);
    expect(await upvoting._count({ item: "post-1" })).toEqual({ count: 1 });

    await upvoting.unvote({ voter: "millie", item: "post-1" });
    expect(await upvoting._count({ item: "post-1" })).toEqual({ count: 0 });
    expect(await upvoting._hasUpvoted({ voter: "millie", item: "post-1" })).toEqual({ result: false });
  });

  test("counts each voter once", async () => {
    await upvoting.upvote({ voter: "millie", item: "post-1" });
    await upvoting.upvote({ voter: "cal", item: "post-1" });
    expect(await upvoting._count({ item: "post-1" })).toEqual({ count: 2 });
    expect(await upvoting._hasUpvoted({ voter: "aron", item: "post-1" })).toEqual({ result: false });
  });

  test("keeps items separate", async () => {
    await upvoting.upvote({ voter: "millie", item: "post-1" });
    expect(await upvoting._count({ item: "post-2" })).toEqual({ count: 0 });
  });

  test("refuses removing an upvote that was never given", async () => {
    await expect(upvoting.unvote({ voter: "millie", item: "post-1" })).rejects.toThrow(NotUpvoted);
  });

  test("refuses removing the same upvote twice", async () => {
    await upvoting.upvote({ voter: "millie", item: "post-1" });
    await upvoting.unvote({ voter: "millie", item: "post-1" });
    await expect(upvoting.unvote({ voter: "millie", item: "post-1" })).rejects.toThrow(NotUpvoted);
  });
});
