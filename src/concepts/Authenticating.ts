import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { MongoServerError, type Collection, type Db } from "mongodb";

export class InvalidUsername extends Error {}
export class WeakPassword extends Error {}
export class UsernameTaken extends Error {}
export class InvalidCredentials extends Error {}

// The username is the account's identity, so it is also the document's _id,
// which MongoDB already keeps unique.
interface Account {
  _id: string;
  salt: string;
  passwordVerifier: string;
}

const USERNAME = /^[A-Za-z0-9_-]{3,32}$/;

function verifier(password: string, salt: string): Buffer {
  return pbkdf2Sync(password, salt, 10_000, 32, "sha256");
}

export class AuthenticatingConcept {
  private readonly accounts: Collection<Account>;

  constructor(db: Db) {
    this.accounts = db.collection<Account>("authenticating.accounts");
  }

  async register({ username, password }: { username: string; password: string }) {
    if (!USERNAME.test(username)) {
      throw new InvalidUsername(
        "A username must contain 3 to 32 letters, numbers, underscores, or hyphens.",
      );
    }
    if (password.length < 8 || password.length > 128) {
      throw new WeakPassword("A password must contain 8 to 128 characters.");
    }
    const salt = crypto.randomUUID();
    try {
      await this.accounts.insertOne({
        _id: username,
        salt,
        passwordVerifier: verifier(password, salt).toString("hex"),
      });
    } catch (error) {
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new UsernameTaken("That username is already registered.");
      }
      throw error;
    }
    return { account: username };
  }

  async authenticate({ username, password }: { username: string; password: string }) {
    const account = await this.accounts.findOne({ _id: username });
    const supplied = account === null ? undefined : verifier(password, account.salt);
    if (
      account === null ||
      supplied === undefined ||
      !timingSafeEqual(Buffer.from(account.passwordVerifier, "hex"), supplied)
    ) {
      throw new InvalidCredentials("The username or password is incorrect.");
    }
    return { account: username };
  }

  async _registered({ username }: { username: string }) {
    const account = await this.accounts.findOne({ _id: username }, { projection: { _id: 1 } });
    return { registered: account !== null };
  }
}
