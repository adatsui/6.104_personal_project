import { conceptSet, registerConcept } from "@mit-sdg/sync-engine/assembly";
import authenticatingSpec from "@design/concepts/Authenticating.md" with { type: "text" };
import chartingSpec from "@design/concepts/Charting.md" with { type: "text" };
import postingSpec from "@design/concepts/Posting.md" with { type: "text" };
import progressingSpec from "@design/concepts/Progressing.md" with { type: "text" };
import sessioningSpec from "@design/concepts/Sessioning.md" with { type: "text" };
import upvotingSpec from "@design/concepts/Upvoting.md" with { type: "text" };
import {
  AuthenticatingConcept,
  InvalidCredentials,
  InvalidUsername,
  UsernameTaken,
  WeakPassword,
} from "./concepts/Authenticating.ts";
import {
  AlreadyMember,
  AlreadyPlaced,
  ChartingConcept,
  ChartNotFound,
  DuplicateColumn,
  DuplicateRow,
  ItemNotFound,
  NotInChart,
  NotMember,
  NotOwner,
} from "./concepts/Charting.ts";
import { EmptyPost, NotAuthor, PostingConcept, PostNotFound, QuoteNeedsCitation } from "./concepts/Posting.ts";
import { InvalidProgress, NotReached, ProgressingConcept } from "./concepts/Progressing.ts";
import { SessioningConcept, UnknownSession } from "./concepts/Sessioning.ts";
import { AlreadyUpvoted, NotUpvoted, UpvotingConcept } from "./concepts/Upvoting.ts";

const authenticating = registerConcept({
  class: AuthenticatingConcept,
  spec: authenticatingSpec,
  refusals: {
    INVALID_USERNAME: InvalidUsername,
    WEAK_PASSWORD: WeakPassword,
    USERNAME_TAKEN: UsernameTaken,
    INVALID_CREDENTIALS: InvalidCredentials,
  },
});

const sessioning = registerConcept({
  class: SessioningConcept,
  spec: sessioningSpec,
  refusals: { UNKNOWN_SESSION: UnknownSession },
});

const charting = registerConcept({
  class: ChartingConcept,
  spec: chartingSpec,
  refusals: {
    CHART_NOT_FOUND: ChartNotFound,
    DUPLICATE_ROW: DuplicateRow,
    DUPLICATE_COLUMN: DuplicateColumn,
    NOT_OWNER: NotOwner,
    ALREADY_MEMBER: AlreadyMember,
    NOT_MEMBER: NotMember,
    NOT_IN_CHART: NotInChart,
    ALREADY_PLACED: AlreadyPlaced,
    ITEM_NOT_FOUND: ItemNotFound,
  },
});

const posting = registerConcept({
  class: PostingConcept,
  spec: postingSpec,
  refusals: {
    POST_NOT_FOUND: PostNotFound,
    QUOTE_NEEDS_CITATION: QuoteNeedsCitation,
    EMPTY_POST: EmptyPost,
    NOT_AUTHOR: NotAuthor,
  },
});

const upvoting = registerConcept({
  class: UpvotingConcept,
  spec: upvotingSpec,
  refusals: { ALREADY_UPVOTED: AlreadyUpvoted, NOT_UPVOTED: NotUpvoted },
});

const progressing = registerConcept({
  class: ProgressingConcept,
  spec: progressingSpec,
  refusals: { INVALID_PROGRESS: InvalidProgress, NOT_REACHED: NotReached },
});

export const applicationConceptSet = conceptSet({
  Authenticating: authenticating,
  Sessioning: sessioning,
  Charting: charting,
  Posting: posting,
  Upvoting: upvoting,
  Progressing: progressing,
});
export const { concepts } = applicationConceptSet;
