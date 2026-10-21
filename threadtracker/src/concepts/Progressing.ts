import type { Collection, Db } from "mongodb";

export class InvalidProgress extends Error {}
export class NotReached extends Error {}

interface Progress {
  _id: string;
  user: string;
  context: string;
  reached: number;
}

export class ProgressingConcept {
  private readonly progresses: Collection<Progress>;
  private indexed = false;

  constructor(db: Db) {
    this.progresses = db.collection<Progress>("progressing.progresses");
  }

  // Created on first use, not in the constructor, so `generate` and `check` never touch the database.
  async #ensureIndex() {
    if (this.indexed) return;
    await this.progresses.createIndex({ user: 1, context: 1 }, { unique: true });
    this.indexed = true;
  }

  async #reachedOf(user: string, context: string): Promise<number> {
    const progress = await this.progresses.findOne({ user, context });
    return progress?.reached ?? 0;
  }

  async setProgress({ user, context, reached }: { user: string; context: string; reached: number }) {
    if (reached < 0) {
      throw new InvalidProgress("Progress must be at least 0.");
    }
    await this.#ensureIndex();
    await this.progresses.updateOne(
      { user, context },
      { $set: { reached }, $setOnInsert: { _id: crypto.randomUUID() } },
      { upsert: true },
    );
    return {};
  }

  async checkReached({ user, context, step }: { user: string; context: string; step: number }) {
    if (step > (await this.#reachedOf(user, context))) {
      throw new NotReached("You haven't reached this part yet.");
    }
    return {};
  }

  async _reached({ user, context }: { user: string; context: string }) {
    return { reached: await this.#reachedOf(user, context) };
  }
}
