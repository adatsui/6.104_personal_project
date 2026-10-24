import { beforeEach, describe, expect, test } from "bun:test";
import { SessioningConcept, UnknownSession } from "../../src/concepts/Sessioning.ts";
import { clear, testDb } from "../testDb.ts";

const db = testDb("sessioning");

beforeEach(() => clear(db));

describe("Sessioning", () => {
  test("principle: a session identifies its subject until it ends", async () => {
    const sessioning = new SessioningConcept(db);
    const { session, expiresAt } = await sessioning.start({ subject: "millie" });
    expect(await sessioning.current({ session })).toEqual({ subject: "millie" });
    expect(await sessioning._active({ session })).toEqual([{ subject: "millie", expiresAt }]);

    expect(await sessioning.end({ session })).toEqual({ ended: true });
    await expect(sessioning.current({ session })).rejects.toThrow(UnknownSession);
    expect(await sessioning._active({ session })).toEqual([]);
  });

  test("a session stops identifying its subject once it expires", async () => {
    let now = new Date("2026-10-21T12:00:00Z");
    const sessioning = new SessioningConcept(db, () => now);
    const { session } = await sessioning.start({ subject: "millie" });
    now = new Date("2026-10-21T12:31:00Z");
    expect(await sessioning._active({ session })).toEqual([]);
    await expect(sessioning.current({ session })).rejects.toThrow(UnknownSession);
  });

  test("refuses an invented session, a missing cookie, and ending a session twice", async () => {
    const sessioning = new SessioningConcept(db);
    await expect(sessioning.current({ session: "invented" })).rejects.toThrow(UnknownSession);
    await expect(sessioning.current({ session: null as unknown as string })).rejects.toThrow(UnknownSession);
    const { session } = await sessioning.start({ subject: "millie" });
    await sessioning.end({ session });
    await expect(sessioning.end({ session })).rejects.toThrow(UnknownSession);
  });

  test("sessions persist: a new instance over the same database still knows the session", async () => {
    const { session } = await new SessioningConcept(db).start({ subject: "millie" });
    expect(await new SessioningConcept(db).current({ session })).toEqual({ subject: "millie" });
  });
});
