import { assemble } from "@mit-sdg/sync-engine/assembly";
import type { Db } from "mongodb";
import { composition as sessions } from "./compositions/Sessions.ts";
import { composition as threadTracker } from "./compositions/ThreadTracker.ts";
import { AuthenticatingConcept } from "./concepts/Authenticating.ts";
import { ChartingConcept } from "./concepts/Charting.ts";
import { PostingConcept } from "./concepts/Posting.ts";
import { ProgressingConcept } from "./concepts/Progressing.ts";
import { SessioningConcept } from "./concepts/Sessioning.ts";
import { UpvotingConcept } from "./concepts/Upvoting.ts";
import { applicationConceptSet } from "./concepts.ts";

/** Builds the app over a database. The server passes the real one; tests pass a test database. */
export function assembleApplication(db: Db) {
  return assemble({
    conceptSet: applicationConceptSet,
    instances: {
      Authenticating: new AuthenticatingConcept(db),
      Sessioning: new SessioningConcept(db),
      Charting: new ChartingConcept(db),
      Posting: new PostingConcept(db),
      Upvoting: new UpvotingConcept(db),
      Progressing: new ProgressingConcept(db),
    },
    composition: { Sessions: sessions, ThreadTracker: threadTracker },
    // Print what went wrong. Otherwise a failure only shows up as INTERNAL_ERROR.
    rawFaultReporter: ({ error }) => console.error(error),
  });
}
