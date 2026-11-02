import { User } from "../models/User.js";

export type Tier = "guest" | "free" | "premium";

export interface TierLimits {
  maxNodes: number; 
  quoteDepth: number; 
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  guest:   { maxNodes: 1,  quoteDepth: 0 },
  free:    { maxNodes: 3,  quoteDepth: 1 },
  premium: { maxNodes: 10, quoteDepth: 2 },
};

export const ABSOLUTE_MAX_NODES = 10;
export const ABSOLUTE_MAX_QUOTE_DEPTH = 3;   // like ABSOLUTE_MAX_NODES: a config typo can't fan out


export async function resolveTier(ctx: { isGuest?: boolean; userId?: string }): Promise<Tier> {
  if (ctx.isGuest) return "guest";
  if (!ctx.userId) return "free";
  const user = await User.findById(ctx.userId).select("tier").lean();
  // .lean() skips schema defaults, so older users with no tier field fall back to free here.
  return user?.tier === "premium" ? "premium" : "free";
}