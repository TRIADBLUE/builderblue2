import type { BusinessIndustry, PrimaryGoal, AICombo } from "../../shared/types.js";

// ─── Template Tags ──────────────────────────────────────────────────────────
// Maps template IDs to the industries and goals they fit best.

export const TEMPLATE_TAGS: Record<string, { industries: BusinessIndustry[]; goals: PrimaryGoal[] }> = {
  blank: {
    industries: ["restaurant", "retail", "professional-services", "construction", "health-wellness", "home-services", "automotive", "real-estate", "creative-agency", "other"],
    goals: ["get-found-online", "sell-products", "book-appointments", "showcase-portfolio", "build-internal-tool", "launch-saas", "other"],
  },
  "react-app": {
    industries: ["creative-agency", "retail", "professional-services", "other"],
    goals: ["showcase-portfolio", "sell-products", "launch-saas"],
  },
  "node-api": {
    industries: ["professional-services", "creative-agency", "other"],
    goals: ["build-internal-tool", "launch-saas"],
  },
  "html-css": {
    industries: ["restaurant", "retail", "construction", "home-services", "automotive", "real-estate", "health-wellness"],
    goals: ["get-found-online", "showcase-portfolio"],
  },
  nextjs: {
    industries: ["professional-services", "creative-agency", "retail", "other"],
    goals: ["get-found-online", "launch-saas", "sell-products"],
  },
};

// ─── AI Combo Lookup ────────────────────────────────────────────────────────
// Each scenario maps to 2-3 combos. Reasons are plain language for SMB owners.

const COMBO_PRESETS: Record<string, AICombo[]> = {
  // SMB wanting to get found online
  "get-found-online": [
    {
      id: "opus-sonnet-seo",
      label: "Best for getting found online",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-sonnet-4-20250514",
      reason: "The Architect carefully plans your site structure so search engines can find you. The Builder writes the code fast so you see results quickly.",
      recommended: true,
    },
    {
      id: "opus-opus-premium",
      label: "Premium quality",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-opus-4-20250514",
      reason: "Both AI assistants set to our most capable model. Takes a bit longer, but produces the highest quality output for every detail.",
      recommended: false,
    },
    {
      id: "opus-llama-fast",
      label: "Fastest results",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "groq",
      builderModel: "llama-3.1-70b-versatile",
      reason: "Smart planning paired with the fastest code generation. Great if you want to iterate quickly and see changes right away.",
      recommended: false,
    },
  ],
  // Sell products (e-commerce)
  "sell-products": [
    {
      id: "opus-sonnet-ecom",
      label: "Best for online stores",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-sonnet-4-20250514",
      reason: "The Architect plans your product pages, cart, and checkout carefully. The Builder generates the storefront code efficiently so your shop goes live faster.",
      recommended: true,
    },
    {
      id: "opus-opus-ecom",
      label: "Premium quality",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-opus-4-20250514",
      reason: "Both set to our strongest model. Best when your product catalog is complex or you need custom payment flows.",
      recommended: false,
    },
  ],
  // Book appointments
  "book-appointments": [
    {
      id: "opus-sonnet-booking",
      label: "Best for scheduling",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-sonnet-4-20250514",
      reason: "The Architect designs your booking flow and availability logic. The Builder codes the interface so your customers can book easily.",
      recommended: true,
    },
    {
      id: "opus-llama-booking",
      label: "Fastest iteration",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "groq",
      builderModel: "llama-3.1-70b-versatile",
      reason: "Smart planning with ultra-fast code generation. Perfect for quickly testing different booking layouts until you find what works.",
      recommended: false,
    },
  ],
  // Showcase portfolio
  "showcase-portfolio": [
    {
      id: "opus-opus-creative",
      label: "Best for creative work",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-opus-4-20250514",
      reason: "Both set to our most capable model. Creative projects deserve the strongest planning and the highest-quality code output.",
      recommended: true,
    },
    {
      id: "opus-sonnet-creative",
      label: "Fast and polished",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-sonnet-4-20250514",
      reason: "Thoughtful design planning with fast code generation. A great balance between quality and speed.",
      recommended: false,
    },
  ],
  // Build internal tool
  "build-internal-tool": [
    {
      id: "deepseek-deepseek-tool",
      label: "Best for internal tools",
      architectProvider: "deepseek",
      architectModel: "deepseek-coder",
      builderProvider: "deepseek",
      builderModel: "deepseek-coder",
      reason: "Both assistants optimized for writing clean, functional code fast. Internal tools need solid logic more than fancy design.",
      recommended: true,
    },
    {
      id: "opus-sonnet-tool",
      label: "Guided build",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-sonnet-4-20250514",
      reason: "If your tool connects to other systems or has complex requirements, the stronger planning capability helps avoid mistakes.",
      recommended: false,
    },
  ],
  // Launch SaaS
  "launch-saas": [
    {
      id: "opus-opus-saas",
      label: "Best for SaaS",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-opus-4-20250514",
      reason: "SaaS products need careful architecture — user accounts, billing, data security. Both models set to maximum capability.",
      recommended: true,
    },
    {
      id: "opus-deepseek-saas",
      label: "Architecture + speed",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "deepseek",
      builderModel: "deepseek-coder",
      reason: "Strong planning for the overall system, paired with a code-focused builder that generates features quickly.",
      recommended: false,
    },
  ],
  // Catch-all
  other: [
    {
      id: "opus-sonnet-default",
      label: "Recommended starting point",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-sonnet-4-20250514",
      reason: "Our most popular combination. Strong planning with fast code generation — works well for most projects.",
      recommended: true,
    },
    {
      id: "opus-opus-default",
      label: "Maximum quality",
      architectProvider: "claude",
      architectModel: "claude-opus-4-20250514",
      builderProvider: "claude",
      builderModel: "claude-opus-4-20250514",
      reason: "Both set to our strongest model. Choose this when quality matters more than speed.",
      recommended: false,
    },
  ],
};

/**
 * Returns recommended templates sorted by relevance (best match first).
 */
export function getRecommendedTemplates(
  industry: BusinessIndustry,
  goal: PrimaryGoal
): { id: string; matchScore: number }[] {
  return Object.entries(TEMPLATE_TAGS)
    .map(([id, tags]) => {
      let score = 0;
      if (tags.industries.includes(industry)) score++;
      if (tags.goals.includes(goal)) score++;
      return { id, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Returns 2-3 AI combo cards based on the user's primary goal.
 */
export function getRecommendedCombos(goal: PrimaryGoal): AICombo[] {
  return COMBO_PRESETS[goal] ?? COMBO_PRESETS.other;
}
