import type { Collection, Db } from "mongodb";

export class UnknownSession extends Error {}

interface Session {
  _id: string;
  subject: string;
  expiresAt: Date;
}

const SESSION_LIFETIME_MS = 30 * 60 * 1000;

export class SessioningConcept {
  private readonly sessions: Collection<Session>;

  constructor(
    db: Db,
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.sessions = db.collection<Session>("sessioning.sessions");
  }

  async start({ subject }: { subject: string }) {
    const now = this.clock();
    await this.sessions.deleteMany({ expiresAt: { $lte: now } });
    const session = crypto.randomUUID();
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
    await this.sessions.insertOne({ _id: session, subject, expiresAt });
    return { session, expiresAt };
  }

  async current({ session }: { session: string }) {
    return { subject: (await this.#active(session)).subject };
  }

  async end({ session }: { session: string }) {
    await this.#active(session);
    await this.sessions.deleteOne({ _id: session });
    return { ended: true };
  }

  async _active({ session }: { session: string }) {
    const found = await this.sessions.findOne({ _id: session });
    if (found === null || found.expiresAt <= this.clock()) return [];
    return [{ subject: found.subject, expiresAt: found.expiresAt }];
  }

  // A missing cookie arrives as null, which no session matches.
  async #active(session: string | null): Promise<Session> {
    const found = session === null ? null : await this.sessions.findOne({ _id: session });
    if (found === null) throw new UnknownSession("This session is not active.");
    if (found.expiresAt <= this.clock()) {
      await this.sessions.deleteOne({ _id: session! });
      throw new UnknownSession("This session is not active.");
    }
    return found;
  }
}
