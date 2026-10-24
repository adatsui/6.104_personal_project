import { beforeEach, describe, expect, test } from "bun:test";
import {
  AuthenticatingConcept,
  InvalidCredentials,
  InvalidUsername,
  UsernameTaken,
  WeakPassword,
} from "../../src/concepts/Authenticating.ts";
import { clear, testDb } from "../testDb.ts";

const db = testDb("authenticating");
const authenticating = new AuthenticatingConcept(db);

beforeEach(() => clear(db));

describe("Authenticating", () => {
  test("principle: a registered username and password authenticate as the same account", async () => {
    expect(await authenticating._registered({ username: "millie" })).toEqual({ registered: false });
    expect(await authenticating.register({ username: "millie", password: "timshel123" })).toEqual({
      account: "millie",
    });
    expect(await authenticating._registered({ username: "millie" })).toEqual({ registered: true });
    expect(await authenticating.authenticate({ username: "millie", password: "timshel123" })).toEqual({
      account: "millie",
    });
  });

  test("refuses registering a username twice", async () => {
    await authenticating.register({ username: "millie", password: "timshel123" });
    await expect(authenticating.register({ username: "millie", password: "different1" })).rejects.toThrow(
      UsernameTaken,
    );
  });

  test("refuses a wrong password and an unknown username", async () => {
    await authenticating.register({ username: "millie", password: "timshel123" });
    await expect(authenticating.authenticate({ username: "millie", password: "wrongpass" })).rejects.toThrow(
      InvalidCredentials,
    );
    await expect(authenticating.authenticate({ username: "nobody", password: "timshel123" })).rejects.toThrow(
      InvalidCredentials,
    );
  });

  test("refuses an invalid username and a weak password", async () => {
    await expect(authenticating.register({ username: "m!", password: "timshel123" })).rejects.toThrow(
      InvalidUsername,
    );
    await expect(authenticating.register({ username: "millie", password: "short" })).rejects.toThrow(WeakPassword);
  });

  test("accounts persist: a new instance over the same database still authenticates", async () => {
    await authenticating.register({ username: "millie", password: "timshel123" });
    const restarted = new AuthenticatingConcept(db);
    expect(await restarted.authenticate({ username: "millie", password: "timshel123" })).toEqual({
      account: "millie",
    });
  });
});
