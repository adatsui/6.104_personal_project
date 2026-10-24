import type { Collection, Db } from "mongodb";

export class PostNotFound extends Error {}
export class QuoteNeedsCitation extends Error {}
export class EmptyPost extends Error {}
export class NotAuthor extends Error {}

interface Post {
  _id: string;
  author: string;
  quote?: string;
  citation?: string;
  analysis?: string;
  commentOn?: string;
  // Posts is a seq in the spec; this counter keeps that order.
  seq: number;
}

interface Content {
  quote?: string;
  citation?: string;
  analysis?: string;
}

/** An empty or all-whitespace field counts as not given. */
function given(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** Applies the content rules shared by create, comment, and edit, and drops empty fields. */
function acceptContent({ quote, citation, analysis }: Content): Content {
  if (given(quote) !== given(citation)) {
    throw new QuoteNeedsCitation("A quote needs a citation, and a citation needs a quote.");
  }
  if (!given(quote) && !given(analysis)) {
    throw new EmptyPost("A post needs a quote, an analysis, or both.");
  }
  return {
    ...(given(quote) ? { quote: quote.trim(), citation: citation!.trim() } : {}),
    ...(given(analysis) ? { analysis: analysis.trim() } : {}),
  };
}

/**
 * What a query row carries for a post's content. The fields are optional, as in
 * the spec (`quote?`), but always present: an absent field is null, so that a
 * former can bind it without dropping the row.
 */
interface ContentRow {
  quote?: string | null;
  citation?: string | null;
  analysis?: string | null;
}

function contentOf(post: Post): ContentRow {
  return {
    quote: post.quote ?? null,
    citation: post.citation ?? null,
    analysis: post.analysis ?? null,
  };
}

export class PostingConcept {
  private readonly posts: Collection<Post>;
  private seq = 0;

  constructor(db: Db) {
    this.posts = db.collection<Post>("posting.posts");
  }

  // Monotonic within a process, and continues after the newest stored post on restart.
  async #nextSeq(): Promise<number> {
    if (this.seq === 0) {
      const last = await this.posts.find().sort({ seq: -1 }).limit(1).next();
      this.seq = last?.seq ?? 0;
    }
    this.seq = Math.max(this.seq + 1, Date.now());
    return this.seq;
  }

  async #existing(post: string): Promise<Post> {
    const found = await this.posts.findOne({ _id: post });
    if (found === null) throw new PostNotFound("There is no such post.");
    return found;
  }

  async create({ author, ...content }: { author: string } & Content) {
    const accepted = acceptContent(content);
    const post = crypto.randomUUID();
    await this.posts.insertOne({ _id: post, author, ...accepted, seq: await this.#nextSeq() });
    return { post };
  }

  async comment({ author, commentOn, ...content }: { author: string; commentOn: string } & Content) {
    await this.#existing(commentOn);
    const accepted = acceptContent(content);
    const post = crypto.randomUUID();
    await this.posts.insertOne({ _id: post, author, ...accepted, commentOn, seq: await this.#nextSeq() });
    return { post };
  }

  async edit({ post, author, ...content }: { post: string; author: string } & Content) {
    const found = await this.#existing(post);
    if (found.author !== author) {
      throw new NotAuthor("Only the author of this post can change it.");
    }
    const accepted = acceptContent(content);
    await this.posts.updateOne(
      { _id: post },
      {
        $set: accepted,
        $unset: {
          ...(accepted.quote === undefined ? { quote: "", citation: "" } : {}),
          ...(accepted.analysis === undefined ? { analysis: "" } : {}),
        },
      },
    );
    return {};
  }

  async delete({ post, author }: { post: string; author: string }) {
    const found = await this.#existing(post);
    if (found.author !== author) {
      throw new NotAuthor("Only the author of this post can change it.");
    }
    const thread = await this.#threadOf(post);
    await this.posts.deleteMany({ _id: { $in: thread.map((p) => p._id) } });
    return {};
  }

  /** The post and every post linked to it through commentOn, at any depth. */
  async #threadOf(post: string): Promise<Post[]> {
    const root = await this.posts.findOne({ _id: post });
    if (root === null) return [];
    const thread = [root];
    for (let frontier = [post]; frontier.length > 0; ) {
      const children = await this.posts.find({ commentOn: { $in: frontier } }).toArray();
      frontier = children.map((child) => child._id);
      thread.push(...children);
    }
    return thread;
  }

  async _thread({ post }: { post: string }) {
    const thread = await this.#threadOf(post);
    return thread.sort((a, b) => a.seq - b.seq).map((p) => ({ post: p._id }));
  }

  async _get({ post }: { post: string }): Promise<Array<{ author: string } & ContentRow>> {
    const found = await this.posts.findOne({ _id: post });
    return found === null ? [] : [{ author: found.author, ...contentOf(found) }];
  }

  async _comments({ post }: { post: string }): Promise<Array<{ comment: string; author: string } & ContentRow>> {
    const comments = await this.posts.find({ commentOn: post }).sort({ seq: 1 }).toArray();
    return comments.map((comment) => ({
      comment: comment._id,
      author: comment.author,
      ...contentOf(comment),
    }));
  }
}
