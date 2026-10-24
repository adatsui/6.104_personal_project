import { MongoServerError, type Collection, type Db } from "mongodb";

export class AlreadyUpvoted extends Error {}
export class NotUpvoted extends Error {}

interface Upvote {
  _id: string;
  voter: string;
  item: string;
}

export class UpvotingConcept {
  private readonly upvotes: Collection<Upvote>;
  private indexed = false;

  constructor(db: Db) {
    this.upvotes = db.collection<Upvote>("upvoting.upvotes");
  }

  // Created on first use, not in the constructor, so `generate` and `check` never touch the database.
  async #ensureIndex() {
    if (this.indexed) return;
    await this.upvotes.createIndex({ voter: 1, item: 1 }, { unique: true });
    this.indexed = true;
  }

  async upvote({ voter, item }: { voter: string; item: string }) {
    await this.#ensureIndex();
    try {
      await this.upvotes.insertOne({ _id: crypto.randomUUID(), voter, item });
    } catch (error) {
      // The unique index refuses a second upvote, even when two requests race.
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new AlreadyUpvoted("You have already upvoted this.");
      }
      throw error;
    }
    return {};
  }

  async unvote({ voter, item }: { voter: string; item: string }) {
    const result = await this.upvotes.deleteOne({ voter, item });
    if (result.deletedCount === 0) {
      throw new NotUpvoted("You have not upvoted this.");
    }
    return {};
  }

  async clear({ item }: { item: string }) {
    await this.upvotes.deleteMany({ item });
    return {};
  }

  async _count({ item }: { item: string }) {
    return { count: await this.upvotes.countDocuments({ item }) };
  }

  async _hasUpvoted({ voter, item }: { voter: string; item: string }) {
    return { result: (await this.upvotes.findOne({ voter, item })) !== null };
  }
}
