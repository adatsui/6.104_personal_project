import { beforeEach, describe, expect, test } from "bun:test";
import { InvalidProgress, NotReached, ProgressingConcept } from "../../src/concepts/Progressing.ts";
import { clear, testDb } from "../testDb.ts";

const db = testDb("progressing");
const progressing = new ProgressingConcept(db);

beforeEach(() => clear(db));

describe("Progressing", () => {
  test("principle: progress is per context, and steps up to it count as reached", async () => {
    expect(await progressing._reached({ user: "millie", context: "eden" })).toEqual({ reached: 0 });

    await progressing.setProgress({ user: "millie", context: "eden", reached: 11 });
    expect(await progressing._reached({ user: "millie", context: "eden" })).toEqual({ reached: 11 });
    expect(await progressing._reached({ user: "millie", context: "gatsby" })).toEqual({ reached: 0 });

    expect(await progressing.checkReached({ user: "millie", context: "eden", step: 11 })).toEqual({});
    await expect(progressing.checkReached({ user: "millie", context: "eden", step: 12 })).rejects.toThrow(NotReached);
  });

  test("progress is per user", async () => {
    await progressing.setProgress({ user: "millie", context: "eden", reached: 11 });
    expect(await progressing._reached({ user: "cal", context: "eden" })).toEqual({ reached: 0 });
  });

  test("moving progress backward hides later steps again", async () => {
    await progressing.setProgress({ user: "millie", context: "eden", reached: 11 });
    await progressing.setProgress({ user: "millie", context: "eden", reached: 8 });
    expect(await progressing._reached({ user: "millie", context: "eden" })).toEqual({ reached: 8 });
    await expect(progressing.checkReached({ user: "millie", context: "eden", step: 9 })).rejects.toThrow(NotReached);
  });

  test("refuses any step for a user with no progress", async () => {
    await expect(progressing.checkReached({ user: "millie", context: "eden", step: 1 })).rejects.toThrow(NotReached);
  });

  test("refuses negative progress, and keeps the progress already recorded", async () => {
    await progressing.setProgress({ user: "millie", context: "eden", reached: 3 });
    await expect(progressing.setProgress({ user: "millie", context: "eden", reached: -1 })).rejects.toThrow(
      InvalidProgress,
    );
    expect(await progressing._reached({ user: "millie", context: "eden" })).toEqual({ reached: 3 });
  });
});
