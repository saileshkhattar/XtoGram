// backend/scripts/explore-thread-fetch.ts
//
// Experiment script: tests ways of fetching a thread DOWNWARD from tweet 1.
//   A) thread_context, paginated (up to MAX_PAGES pages)
//   B) advanced_search with conversation_id operators (1 page each)
//
// For each experiment it prints a compact table and writes ONE small file,
// fixtures-out/thread-explore.json  <- send me this one.
// Raw pages are saved separately as fixtures-out/raw-<label>-p<N>.json
// (only send those if I ask).
//
// Run from /backend:   npx tsx scripts/explore-thread-fetch.ts
//
// This script does NOT import any app code (no env.ts, no Mongo).
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// ---------------------------------------------------------------------------
// 1. CONFIG
// ---------------------------------------------------------------------------
// Tweet 1 of the 6-tweet thread captured last time (prefilled).
const START_URL = "https://x.com/krodhidaanav/status/2110993216208261171";

const BASE_URL = "https://api.twitterapi.io/twitter";
const MAX_PAGES = 4; // thread_context pages to fetch
const CALL_DELAY_MS = 5500;
const RETRY_429_DELAY_MS = 12000;

// Run flags, switch off what you don't want to spend calls on.
const RUN_THREAD_CONTEXT = true;
const RUN_SEARCH = true;

// Advanced-search endpoint, from my recollection of the provider docs:
//   GET /twitter/tweet/advanced_search?query=...&queryType=Latest
// CONFIRM IN THE DOCS. If the path or params differ, change them here.
const SEARCH_PATH = "/tweet/advanced_search";
const SEARCH_EXTRA_PARAMS = "&queryType=Latest";

const OUT_DIR = path.resolve(process.cwd(), "fixtures-out");
const API_KEY = process.env.TWITTER_API_KEY;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// 2. API helper: spaced calls, one retry on 429, never throws
// ---------------------------------------------------------------------------
type ApiResult = { ok: true; data: any } | { ok: false; error: string };
let lastCallAt = 0;

async function apiGet(url: string): Promise<ApiResult> {
  const attempt = async () => {
    const wait = lastCallAt + CALL_DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCallAt = Date.now();
    const res = await fetch(url, { headers: { "x-api-key": API_KEY! } });
    const text = await res.text();
    let body: any = null;
    try {
      body = JSON.parse(text);
    } catch {
      /* keep text */
    }
    return { status: res.status, body, text };
  };

  try {
    let r = await attempt();
    if (r.status === 429) {
      console.log(`  429, waiting ${RETRY_429_DELAY_MS / 1000}s then retrying once...`);
      await sleep(RETRY_429_DELAY_MS);
      r = await attempt();
    }
    if (r.status < 200 || r.status >= 300) {
      return { ok: false, error: `HTTP ${r.status}: ${r.text.slice(0, 300)}` };
    }
    return { ok: true, data: r.body };
  } catch (err: any) {
    return { ok: false, error: `Network error: ${err?.message || String(err)}` };
  }
}

// ---------------------------------------------------------------------------
// 3. Row extraction + downward-chain reconstruction
// ---------------------------------------------------------------------------
type Row = {
  id: string;
  handle: string;
  isReply: boolean;
  inReplyToId: string | null;
  conversationId: string | null;
  createdAt: string;
  replyCount: number;
  textLen: number;
  textStart: string;
};

function toRow(t: any): Row {
  return {
    id: String(t?.id ?? ""),
    handle: t?.author?.userName ?? "",
    isReply: !!t?.isReply,
    inReplyToId: t?.inReplyToId ? String(t.inReplyToId) : null,
    conversationId: t?.conversationId ? String(t.conversationId) : null,
    createdAt: t?.createdAt ?? "",
    replyCount: t?.replyCount ?? 0,
    textLen: (t?.text || "").length,
    textStart: (t?.text || "").replace(/\s+/g, " ").slice(0, 60),
  };
}

function itemsOf(data: any): any[] {
  if (Array.isArray(data?.tweets)) return data.tweets;
  if (Array.isArray(data?.replies)) return data.replies; // docs said "replies"
  return [];
}

// Follow same-author self-replies downward from the focus tweet.
function reconstructDown(allRows: Row[], focusId: string, focusHandle: string) {
  const byId = new Map<string, Row>();
  allRows.forEach((r) => byId.set(r.id, r));

  const sameAuthor = [...byId.values()].filter(
    (r) => r.handle.toLowerCase() === focusHandle.toLowerCase(),
  );
  const childrenOf = new Map<string, Row[]>();
  sameAuthor.forEach((r) => {
    if (!r.inReplyToId) return;
    const list = childrenOf.get(r.inReplyToId) ?? [];
    list.push(r);
    childrenOf.set(r.inReplyToId, list);
  });

  const chain: string[] = [focusId];
  let cur = focusId;
  const seen = new Set<string>([focusId]);
  while (true) {
    const kids = (childrenOf.get(cur) ?? []).filter((k) => !seen.has(k.id));
    if (!kids.length) break;
    kids.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    cur = kids[0].id;
    seen.add(cur);
    chain.push(cur);
  }

  const unlinked = sameAuthor.filter((r) => !seen.has(r.id)).map((r) => r.id);
  return { chain, unlinkedSameAuthorIds: unlinked };
}

function printRows(label: string, rows: Row[]) {
  rows.forEach((r, i) =>
    console.log(
      `   [${i}] ${r.id} @${r.handle} reply=${r.isReply} to=${r.inReplyToId ?? "-"} ` +
        `conv=${r.conversationId ?? "-"} len=${r.textLen} | ${r.textStart}`,
    ),
  );
}

// ---------------------------------------------------------------------------
// 4. Experiments
// ---------------------------------------------------------------------------
type PageSummary = {
  pageIndex: number;
  itemCount: number;
  has_next_page: any;
  next_cursor: string | null;
  status: any;
  rows: Row[];
};

type Experiment = {
  label: string;
  request: string;
  pages: PageSummary[];
  allDistinctTweets: number;
  downwardChain: string[] | null;
  unlinkedSameAuthorIds: string[] | null;
  error?: string;
};

async function runThreadContext(tweetId: string, handle: string): Promise<Experiment> {
  const label = "thread_context";
  console.log(`\n=== ${label} (up to ${MAX_PAGES} pages) ===`);
  const exp: Experiment = {
    label,
    request: `${BASE_URL}/tweet/thread_context?tweetId=${tweetId}&cursor=<paged>`,
    pages: [],
    allDistinctTweets: 0,
    downwardChain: null,
    unlinkedSameAuthorIds: null,
  };

  let cursor = "";
  const all: Row[] = [];

  for (let p = 0; p < MAX_PAGES; p++) {
    const url = `${BASE_URL}/tweet/thread_context?tweetId=${tweetId}&cursor=${encodeURIComponent(cursor)}`;
    const r = await apiGet(url);
    if (!r.ok) {
      exp.error = `page ${p}: ${r.error}`;
      console.log(`  !! ${exp.error}`);
      break;
    }
    await writeFile(path.join(OUT_DIR, `raw-${label}-p${p}.json`), JSON.stringify(r.data, null, 2));

    const rows = itemsOf(r.data).map(toRow);
    all.push(...rows);
    const next = r.data?.next_cursor ? String(r.data.next_cursor) : null;
    exp.pages.push({
      pageIndex: p,
      itemCount: rows.length,
      has_next_page: r.data?.has_next_page,
      next_cursor: next ? next.slice(0, 24) + "..." : null,
      status: r.data?.status,
      rows,
    });
    console.log(`  page ${p}: ${rows.length} items, has_next_page=${r.data?.has_next_page}`);
    printRows(label, rows);

    if (!r.data?.has_next_page || !next) break;
    cursor = next;
  }

  const distinct = new Map<string, Row>();
  all.forEach((r) => distinct.set(r.id, r));
  exp.allDistinctTweets = distinct.size;
  const rec = reconstructDown([...distinct.values()], tweetId, handle);
  exp.downwardChain = rec.chain;
  exp.unlinkedSameAuthorIds = rec.unlinkedSameAuthorIds;
  console.log(`  -> distinct tweets across pages: ${distinct.size}`);
  console.log(`  -> downward self-reply chain from focus: ${rec.chain.length} tweet(s)`);
  return exp;
}

async function runSearch(
  label: string,
  query: string,
  tweetId: string,
  handle: string,
): Promise<Experiment> {
  console.log(`\n=== ${label}: ${query} ===`);
  const url = `${BASE_URL}${SEARCH_PATH}?query=${encodeURIComponent(query)}${SEARCH_EXTRA_PARAMS}`;
  const exp: Experiment = {
    label,
    request: url,
    pages: [],
    allDistinctTweets: 0,
    downwardChain: null,
    unlinkedSameAuthorIds: null,
  };

  const r = await apiGet(url);
  if (!r.ok) {
    exp.error = r.error;
    console.log(`  !! ${r.error}`);
    return exp;
  }
  await writeFile(path.join(OUT_DIR, `raw-${label}-p0.json`), JSON.stringify(r.data, null, 2));

  const rows = itemsOf(r.data).map(toRow);
  const next = r.data?.next_cursor ? String(r.data.next_cursor) : null;
  exp.pages.push({
    pageIndex: 0,
    itemCount: rows.length,
    has_next_page: r.data?.has_next_page,
    next_cursor: next ? next.slice(0, 24) + "..." : null,
    status: r.data?.status,
    rows,
  });
  console.log(`  ${rows.length} items, has_next_page=${r.data?.has_next_page}`);
  printRows(label, rows);

  const distinct = new Map<string, Row>();
  rows.forEach((x) => distinct.set(x.id, x));
  exp.allDistinctTweets = distinct.size;
  // The search results may not include the focus tweet itself; add a stub so
  // the chain walk can start from it.
  if (!distinct.has(tweetId)) {
    distinct.set(tweetId, {
      id: tweetId,
      handle,
      isReply: false,
      inReplyToId: null,
      conversationId: tweetId,
      createdAt: "",
      replyCount: 0,
      textLen: 0,
      textStart: "(stub: focus tweet not in results)",
    });
  }
  const rec = reconstructDown([...distinct.values()], tweetId, handle);
  exp.downwardChain = rec.chain;
  exp.unlinkedSameAuthorIds = rec.unlinkedSameAuthorIds;
  console.log(`  -> downward self-reply chain from focus: ${rec.chain.length} tweet(s)`);
  return exp;
}

// ---------------------------------------------------------------------------
// 5. Main
// ---------------------------------------------------------------------------
async function main() {
  if (!API_KEY) {
    console.error("TWITTER_API_KEY is missing from .env");
    process.exit(1);
  }
  const m = START_URL.match(/x\.com\/([^/]+)\/status\/(\d+)|twitter\.com\/([^/]+)\/status\/(\d+)/);
  const handle = m?.[1] ?? m?.[3];
  const tweetId = m?.[2] ?? m?.[4];
  if (!handle || !tweetId) {
    console.error(`Could not read handle/id from START_URL: ${START_URL}`);
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  const experiments: Experiment[] = [];

  if (RUN_THREAD_CONTEXT) experiments.push(await runThreadContext(tweetId, handle));

  if (RUN_SEARCH) {
    experiments.push(
      await runSearch("search-conv-from", `conversation_id:${tweetId} from:${handle}`, tweetId, handle),
    );
    experiments.push(await runSearch("search-conv-only", `conversation_id:${tweetId}`, tweetId, handle));
  }

  const out = {
    startedFrom: START_URL,
    ranAt: new Date().toISOString(),
    knownThreadSize: "6 tweets by the same author (first four ids known from the earlier capture)",
    experiments,
  };
  await writeFile(path.join(OUT_DIR, "thread-explore.json"), JSON.stringify(out, null, 2));

  console.log("\n=== SUMMARY ===");
  experiments.forEach((e) =>
    console.log(
      `${e.label}: pages=${e.pages.length}, distinctTweets=${e.allDistinctTweets}, ` +
        `downwardChain=${e.downwardChain?.length ?? "n/a"}${e.error ? `, ERROR=${e.error}` : ""}`,
    ),
  );
  console.log(`\nWrote ${path.join(OUT_DIR, "thread-explore.json")}  <- send me this file`);
}

main().catch((err) => {
  console.error("Unexpected failure:", err);
  process.exit(1);
});