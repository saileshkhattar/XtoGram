// backend/scripts/capture-fixtures.ts
//
// One-off script: fetches a handful of real tweets and saves BOTH the raw
// TwitterAPI.io response and our parsed shape, so the frontend can use them
// as fixtures without making any more API calls.
//
// Run from /backend:   npx tsx scripts/capture-fixtures.ts
//
// NOTE: "dotenv/config" must stay the FIRST import. tweet.service.ts imports
// config/env.ts, which throws if env vars are missing, so .env has to be
// loaded before that import is evaluated.
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractTweetId, parseTweet } from "../src/services/tweet.service.js";

// ---------------------------------------------------------------------------
// 1. FILL THESE IN
// ---------------------------------------------------------------------------
type Mode = "single" | "chain" | "thread_context";

type Case = { label: string; url: string; mode: Mode };

const CASES: Case[] = [
  // Tweet 1 of a self-thread
  { label: "thread-first", url: "https://x.com/krodhidaanav/status/2110993216208261171?s=20", mode: "single" },
  // A tweet from the middle of the SAME thread (walks up to 3 ancestors)
  { label: "thread-middle", url: "https://x.com/krodhidaanav/status/2110993225414775249?s=20", mode: "chain" },
  // Final reply of a reply chain between two different authors
  { label: "reply-chain", url: "https://x.com/swmonsoon/status/2110995601106276664?s=20", mode: "chain" },
  // A quote tweet
  { label: "quote", url: "https://x.com/Justwandyy/status/2110645689155744244?s=20", mode: "single" },
  // A quote of a quote (checks whether the payload nests deeper than 1 level)
  { label: "quote-of-quote", url: "https://x.com/RealAnujX/status/2110761483072422124?s=20", mode: "single" },
  // A tweet with 4 images
  { label: "four-images", url: "https://x.com/DelhiPolice/status/2110717943978000884?s=20", mode: "single" },
  // A long tweet (> 280 chars)
  { label: "long-text", url: "https://x.com/MostlyKohli/status/2110973443466535395?s=20", mode: "single" },
  // ONE thread_context test (use tweet 1 or any tweet of a thread). 1 page only.
  { label: "thread-context-test", url: "https://x.com/krodhidaanav/status/2110993216208261171?s=20", mode: "thread_context" },
];

// ---------------------------------------------------------------------------
// 2. Config
// ---------------------------------------------------------------------------
const BASE_URL = "https://api.twitterapi.io/twitter";
const CALL_DELAY_MS = 5500; // matches CHAIN_DELAY_MS in tweet.service.ts
const RETRY_429_DELAY_MS = 12000;
const MAX_ANCESTORS = 3;
const OUT_DIR = path.resolve(process.cwd(), "fixtures-out");
const API_KEY = process.env.TWITTER_API_KEY;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// 3. API helpers. Every call goes through apiGet, which enforces the spacing
//    between calls and does a single retry on 429. Never throws.
// ---------------------------------------------------------------------------
type ApiResult = { ok: true; data: any } | { ok: false; error: string };

let lastCallAt = 0;

async function apiGet(url: string): Promise<ApiResult> {
  const attempt = async (): Promise<{ status: number; body: any; text: string }> => {
    // Space out every call, including the first one after a long gap.
    const wait = lastCallAt + CALL_DELAY_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastCallAt = Date.now();

    const res = await fetch(url, { headers: { "x-api-key": API_KEY! } });
    const text = await res.text();
    let body: any = null;
    try {
      body = JSON.parse(text);
    } catch {
      /* non-JSON body, keep text */
    }
    return { status: res.status, body, text };
  };

  try {
    let r = await attempt();

    if (r.status === 429) {
      console.log(`  429 received, waiting ${RETRY_429_DELAY_MS / 1000}s then retrying once...`);
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

// Same endpoint and response shape as fetchRawTweet() in tweet.service.ts,
// minus the Mongo cache (so this script has no DB dependency).
async function fetchRaw(tweetId: string): Promise<{ raw: any | null; error?: string }> {
  const r = await apiGet(`${BASE_URL}/tweets?tweet_ids=${tweetId}`);
  if (!r.ok) return { raw: null, error: r.error };
  const raw = r.data?.tweets?.[0] ?? null;
  if (!raw) return { raw: null, error: "Response had no tweets[0]" };
  return { raw };
}

function safeParse(raw: any): any {
  try {
    return parseTweet(raw);
  } catch (err: any) {
    return { __parseError: err?.message || String(err) };
  }
}

// ---------------------------------------------------------------------------
// 4. Console summary (one line per tweet)
// ---------------------------------------------------------------------------
function summarize(label: string, raw: any): string {
  const q = raw?.quoted_tweet;
  const nested = !!q?.quoted_tweet;
  const mediaCount = (raw?.extendedEntities?.media || []).filter(
    (m: any) => m.type === "photo",
  ).length;
  const parts = [
    `[${label}]`,
    `id=${raw?.id}`,
    `textLen=${(raw?.text || "").length}`,
    `isReply=${raw?.isReply}`,
    `inReplyToId=${raw?.inReplyToId || "-"}`,
    `conversationId=${raw?.conversationId ?? raw?.conversation_id ?? "(none)"}`,
    `photos=${mediaCount}`,
    `quoted=${!!q}`,
    `quotedHasQuote=${nested}`,
  ];
  return parts.join(" | ");
}

// ---------------------------------------------------------------------------
// 5. Mode handlers. Each returns { raw, parsed, error? } for the output file.
// ---------------------------------------------------------------------------
async function runSingle(tweetId: string, label: string) {
  const { raw, error } = await fetchRaw(tweetId);
  if (!raw) return { raw: null, parsed: null, error };
  console.log("  " + summarize(label, raw));
  return { raw, parsed: safeParse(raw) };
}

async function runChain(tweetId: string, label: string) {
  // Oldest first in the output, to match the app's chain ordering.
  const rawChain: any[] = [];
  const parsedChain: any[] = [];
  const errors: string[] = [];

  let currentId: string | null = tweetId;
  for (let i = 0; i <= MAX_ANCESTORS && currentId; i++) {
    const { raw, error } = await fetchRaw(currentId);
    if (!raw) {
      errors.push(`hop ${i} (${currentId}): ${error}`);
      break;
    }
    console.log("  " + summarize(`${label}#${i === 0 ? "focus" : "up" + i}`, raw));
    rawChain.unshift(raw);
    parsedChain.unshift(safeParse(raw));
    currentId = raw.inReplyToId || raw.in_reply_to_status_id_str || null;
  }

  return {
    raw: rawChain,
    parsed: parsedChain,
    error: errors.length ? errors.join("; ") : undefined,
  };
}

async function runThreadContext(tweetId: string, label: string) {
  // One page only, no pagination loop.
  const r = await apiGet(`${BASE_URL}/tweet/thread_context?tweetId=${tweetId}&cursor=`);
  if (!r.ok) return { raw: null, parsed: null, error: r.error };

  const replies: any[] = Array.isArray(r.data?.replies) ? r.data.replies : [];
  console.log(
    `  [${label}] items=${replies.length} | has_next_page=${r.data?.has_next_page} | status=${r.data?.status}`,
  );
  replies.forEach((t, i) => console.log("    " + summarize(`${label}[${i}]`, t)));

  // The item shape is unknown, so parse defensively, one item at a time.
  const parsed = replies.map((t) => safeParse(t));
  return { raw: r.data, parsed };
}

// ---------------------------------------------------------------------------
// 6. Main
// ---------------------------------------------------------------------------
async function main() {
  if (!API_KEY) {
    console.error("TWITTER_API_KEY is missing from .env");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const todo = CASES.filter((c) => !c.url.startsWith("PASTE_"));
  const skipped = CASES.length - todo.length;
  if (skipped) console.log(`Skipping ${skipped} case(s) with placeholder URLs.\n`);
  if (!todo.length) {
    console.error("No URLs filled in. Edit the CASES list at the top of the script.");
    process.exit(1);
  }

  const all: any[] = [];

  for (const c of todo) {
    console.log(`\n=== ${c.label} (${c.mode}) ===`);
    const tweetId = extractTweetId(c.url);

    let result: { raw: any; parsed: any; error?: string };

    if (!tweetId) {
      result = { raw: null, parsed: null, error: `Could not extract tweet id from "${c.url}"` };
    } else if (c.mode === "single") {
      result = await runSingle(tweetId, c.label);
    } else if (c.mode === "chain") {
      result = await runChain(tweetId, c.label);
    } else {
      result = await runThreadContext(tweetId, c.label);
    }

    if (result.error) console.log(`  !! ${result.error}`);

    const entry = {
      label: c.label,
      url: c.url,
      mode: c.mode,
      fetchedAt: new Date().toISOString(),
      raw: result.raw,
      parsed: result.parsed,
      ...(result.error ? { error: result.error } : {}),
    };

    all.push(entry);
    await writeFile(path.join(OUT_DIR, `${c.label}.json`), JSON.stringify(entry, null, 2));
  }

  await writeFile(path.join(OUT_DIR, "all.json"), JSON.stringify(all, null, 2));
  console.log(`\nDone. Wrote ${all.length} case file(s) + all.json to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("Unexpected failure:", err);
  process.exit(1);
});

