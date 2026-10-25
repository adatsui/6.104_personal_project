/**
 * Error messages, worded per form.
 *
 * The browser receives only an error category (see src/http.ts), so each place
 * in the UI says what that category means there. Every message gives the
 * instruction first, then the reason, with no contractions.
 */
import { currentUser, signInNotice } from "./api.ts";
import { router } from "./router.ts";

export type Place =
  | "register"
  | "signIn"
  | "newChart"
  | "addMember"
  | "addElement"
  | "openChart"
  | "progress"
  | "idea"
  | "comment"
  | "change"
  | "upvote"
  | "unvote";

const NOT_READ = "Mark this chapter as read first. You have not read this chapter yet.";
const FALLBACK = "Try again. Something went wrong.";

const messages: Record<Place, Partial<Record<string, string>>> = {
  register: {
    CONFLICT: "Choose a different username. That username is already taken.",
    INVALID_REQUEST:
      "Choose a username of 3 to 32 letters, numbers, underscores, or hyphens, and a password of 8 to 128 characters.",
  },
  signIn: {
    UNAUTHORIZED: "Check your username and password. They do not match an account.",
    INVALID_REQUEST: "Check your username and password. They do not match an account.",
  },
  newChart: {
    CONFLICT: "Rename the duplicate chapter or literary element. Two of them have the same name.",
  },
  addMember: {
    NOT_FOUND: 'Check the username. No one has registered as "{name}".',
    CONFLICT: "Choose someone else. {name} is already a member of this chart.",
    FORBIDDEN: "Ask the owner to add members. Only the owner of this chart can add members.",
  },
  addElement: {
    CONFLICT: 'Choose a different name. This chart already has a literary element called "{name}".',
    FORBIDDEN: "Ask the owner of this chart to add you. You are not a member of this chart.",
  },
  openChart: {
    FORBIDDEN: "Ask the owner of this chart to add you. You are not a member of this chart.",
    NOT_FOUND: "Go back to My Charts. This chart does not exist.",
  },
  progress: {
    NOT_FOUND: "Refresh the chart. That chapter is not in this chart.",
    FORBIDDEN: "Ask the owner of this chart to add you. You are not a member of this chart.",
  },
  idea: {
    INVALID_REQUEST: "Check your idea. A quote needs a citation, and an idea needs a quote, an analysis, or both.",
    FORBIDDEN: NOT_READ,
    NOT_FOUND: "Refresh the chart. That chapter or literary element is not in this chart.",
  },
  comment: {
    INVALID_REQUEST:
      "Check your comment. A quote needs a citation, and a comment needs a quote, an analysis, or both.",
    FORBIDDEN: NOT_READ,
    NOT_FOUND: "Refresh the chart. That idea has been deleted.",
  },
  change: {
    INVALID_REQUEST: "Check your idea. A quote needs a citation, and an idea needs a quote, an analysis, or both.",
    FORBIDDEN: "Ask the author to change it. Only the author can edit or delete this idea.",
    NOT_FOUND: "Refresh the chart. That idea has already been deleted.",
  },
  upvote: {
    CONFLICT: 'Use "Remove upvote" to undo it. You have already upvoted this idea.',
    FORBIDDEN: NOT_READ,
    NOT_FOUND: "Refresh the chart. That idea has been deleted.",
  },
  unvote: {
    CONFLICT: "Upvote it first. You have not upvoted this idea.",
    NOT_FOUND: "Refresh the chart. That idea has been deleted.",
  },
};

/**
 * Turns an error from the API into the message for this place. An ended session
 * sends the user to sign in instead, from anywhere except the sign-in form.
 */
export function messageFor(place: Place, error: string, name = ""): string {
  if (error === "UNAUTHORIZED" && place !== "signIn") {
    currentUser.value = null;
    signInNotice.value = "Sign in again. Your session has ended.";
    void router.push({ name: "signIn" });
    return signInNotice.value;
  }
  return (messages[place][error] ?? FALLBACK).replaceAll("{name}", name);
}

/** The content rules for an idea or comment, checked before sending. */
export function contentProblem(
  kind: "idea" | "comment",
  { quote, citation, analysis }: { quote: string; citation: string; analysis: string },
): string | null {
  const hasQuote = quote.trim() !== "";
  const hasCitation = citation.trim() !== "";
  if (hasQuote && !hasCitation) return "Add a citation. A quote needs a citation.";
  if (hasCitation && !hasQuote) return "Add a quote. A citation needs a quote.";
  if (!hasQuote && analysis.trim() === "") {
    return `Add a quote or an analysis. ${kind === "idea" ? "An idea" : "A comment"} cannot be empty.`;
  }
  return null;
}
