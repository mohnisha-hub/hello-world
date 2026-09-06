export interface SearchablePerfume {
  id: string;
  name: string;
  saleType?: string | null;
  minBidCents?: number | null;
  priceCents: number;
  ml: number | null;
  kind: string | null;
  fill: string | null;
  imageUrl: string | null;
  description: string | null;
  topNotes?: string | null;
  middleNotes?: string | null;
  baseNotes?: string | null;
  status: string;
  collectionName?: string | null;
  collectionStatus?: string | null;
  owner: {
    id: string;
    username: string;
    photoUrl: string | null;
    location: string | null;
    bio: string | null;
    profileStatus: string;
  };
}

export interface SearchableCollection {
  id: string;
  name: string;
  photoUrl: string | null;
  status: string;
  perfumeCount: number;
  owner: SearchablePerfume["owner"];
}

export interface MatchedUserGroup {
  user: SearchablePerfume["owner"] & {
    rating?: { average: number; count: number } | null;
  };
  matchingPerfumes: SearchablePerfume[];
  score: number;
}

// Simple Levenshtein distance for fuzzy typo matching
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

// Check if token fuzzy matches any word in text
function fuzzyMatchToken(token: string, words: string[]): { matched: boolean; score: number } {
  const lowerToken = token.toLowerCase();
  let bestScore = 0;

  for (const word of words) {
    const lowerWord = word.toLowerCase();

    // Exact word match
    if (lowerWord === lowerToken) {
      return { matched: true, score: 100 };
    }

    // Substring / Prefix match
    if (lowerWord.startsWith(lowerToken)) {
      const score = 80 * (lowerToken.length / lowerWord.length);
      if (score > bestScore) bestScore = score;
      continue;
    }

    if (lowerWord.includes(lowerToken)) {
      const score = 60 * (lowerToken.length / lowerWord.length);
      if (score > bestScore) bestScore = score;
      continue;
    }

    // Levenshtein match for words of length >= 4 with typo allowance
    if (lowerToken.length >= 4 && lowerWord.length >= 3) {
      const maxDistance = lowerToken.length <= 5 ? 1 : 2;
      const dist = levenshteinDistance(lowerToken, lowerWord);
      if (dist <= maxDistance) {
        const score = Math.max(30, 70 - dist * 20);
        if (score > bestScore) bestScore = score;
      }
    }
  }

  return { matched: bestScore > 0, score: bestScore };
}

export function searchPerfumesAndGroupUsers(
  perfumes: SearchablePerfume[],
  query: string,
  ratingMap: Record<string, { average: number; count: number } | null> = {}
): MatchedUserGroup[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const queryTokens = trimmed.split(/\s+/).filter(Boolean);
  const userMap = new Map<string, MatchedUserGroup>();

  for (const p of perfumes) {
    // Only search public listings of published profiles
    if (p.status !== "published" || p.owner.profileStatus !== "published") {
      continue;
    }
    if (p.collectionStatus && p.collectionStatus !== "published" && p.collectionStatus !== "sold") {
      continue;
    }

    const nameWords = (p.name || "").replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
    const descWords = (p.description || "").replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
    const collectionWords = (p.collectionName || "").replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
    const noteWords = `${p.topNotes || ""} ${p.middleNotes || ""} ${p.baseNotes || ""}`
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const fullText = `${p.name} ${p.description || ""} ${p.collectionName || ""} ${p.topNotes || ""} ${p.middleNotes || ""} ${p.baseNotes || ""}`.toLowerCase();

    // Check full substring match as top boost
    let totalScore = 0;
    if (fullText.includes(trimmed)) {
      totalScore += 150;
    }

    // Match each token
    let allTokensMatched = true;
    for (const token of queryTokens) {
      const nameMatch = fuzzyMatchToken(token, nameWords);
      const collectionMatch = fuzzyMatchToken(token, collectionWords);
      const descMatch = fuzzyMatchToken(token, descWords);
      const noteMatch = fuzzyMatchToken(token, noteWords);

      if (nameMatch.matched) {
        totalScore += nameMatch.score * 2; // Name matches have higher weight
      } else if (collectionMatch.matched) {
        totalScore += collectionMatch.score * 1.5;
      } else if (noteMatch.matched) {
        totalScore += noteMatch.score * 1.2;
      } else if (descMatch.matched) {
        totalScore += descMatch.score;
      } else {
        allTokensMatched = false;
      }
    }

    if (totalScore > 0 && allTokensMatched) {
      const ownerId = p.owner.id;
      if (!userMap.has(ownerId)) {
        userMap.set(ownerId, {
          user: {
            ...p.owner,
            rating: ratingMap[ownerId] || null,
          },
          matchingPerfumes: [],
          score: 0,
        });
      }

      const group = userMap.get(ownerId)!;
      group.matchingPerfumes.push(p);
      group.score = Math.max(group.score, totalScore);
    }
  }

  return Array.from(userMap.values()).sort((a, b) => b.score - a.score);
}

export function searchCollections(
  collections: SearchableCollection[],
  query: string,
): SearchableCollection[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  const queryTokens = trimmed.split(/\s+/).filter(Boolean);

  return collections
    .filter((collection) => {
      if (collection.status !== "published" || collection.owner.profileStatus !== "published") {
        return false;
      }
      const words = (collection.name || "").replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
      if (collection.name.toLowerCase().includes(trimmed)) return true;
      return queryTokens.every((token) => fuzzyMatchToken(token, words).matched);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
