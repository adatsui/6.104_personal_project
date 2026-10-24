import { httpWire } from "@mit-sdg/sync-engine-http/tooling";
import { MongoClient } from "mongodb";
import { assembleApplication } from "./src/assembly.ts";
import { policy } from "./src/http.ts";

// The tools only build the app; they never connect, so any database handle works.
const toolingDb = new MongoClient("mongodb://127.0.0.1:27017").db("threadtracker");

export default {
  assemble: () => assembleApplication(toolingDb),
  title: "ThreadTracker",
  wireName: "ThreadTrackerWire",
  design: {
    version: 1,
    documents: [
      new URL("./design/types.md", import.meta.url),
      new URL("./design/compositions/Sessions.md", import.meta.url),
      new URL("./design/compositions/ThreadTracker.md", import.meta.url),
    ],
  },
  projections: [httpWire({ policy, name: "ThreadTrackerWireHttp" })],
};
