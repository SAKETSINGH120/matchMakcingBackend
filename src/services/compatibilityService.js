/**
 * Compatibility Scoring Service
 *
 * Calculates a compatibility score (0–100) between two users based on:
 *   1. Shared interests           (30% weight)
 *   2. Location proximity         (25% weight)
 *   3. Activity / recency         (15% weight)
 *   4. Lifestyle alignment        (15% weight)
 *   5. Relationship goal match    (15% weight)
 *
 * Each dimension produces a normalised 0–1 value which is then
 * multiplied by its weight and summed into a final percentage.
 */

const WEIGHTS = {
  interests: 0.3,
  location: 0.25,
  activity: 0.15,
  lifestyle: 0.15,
  relationshipGoal: 0.15,
};

const compatibilityService = {
  calculateScore(userA, userB, distanceKm = null) {
    const interestsScore = this._interestsScore(userA, userB);
    const locationScore = this._locationScore(userA, userB, distanceKm);
    const activityScore = this._activityScore(userA, userB);
    const lifestyleScore = this._lifestyleScore(userA, userB);
    const goalScore = this._relationshipGoalScore(userA, userB);

    const raw =
      interestsScore * WEIGHTS.interests +
      locationScore * WEIGHTS.location +
      activityScore * WEIGHTS.activity +
      lifestyleScore * WEIGHTS.lifestyle +
      goalScore * WEIGHTS.relationshipGoal;

    return Math.round(raw * 100);
  },

  //  Dimension scorers (each returns 0–1) , Jaccard similarity on interests arrays

  _interestsScore(userA, userB) {
    const a = new Set(
      (userA.interests || []).map((i) => i.toLowerCase().trim()),
    );
    const b = new Set(
      (userB.interests || []).map((i) => i.toLowerCase().trim()),
    );

    if (a.size === 0 && b.size === 0) return 0.5; // neutral

    let intersection = 0;
    for (const item of a) {
      if (b.has(item)) intersection++;
    }

    const union = new Set([...a, ...b]).size;
    return union === 0 ? 0 : intersection / union;
  },

  //location
  _locationScore(userA, userB, distanceKm) {
    const maxDist = userA.preferences?.maxDistanceKm || 50;

    if (distanceKm === null || distanceKm === undefined) {
      const coordsA = userA.location?.coordinates;
      const coordsB = userB.location?.coordinates;

      if (
        coordsA?.length === 2 &&
        coordsB?.length === 2 &&
        coordsA[0] !== 0 &&
        coordsB[0] !== 0
      ) {
        distanceKm = this._haversineKm(coordsA, coordsB);
      } else {
        return 0.3; // unknown — then assing low score
      }
    }

    if (distanceKm <= 0) return 1;
    if (distanceKm >= maxDist) return 0;

    return 1 - distanceKm / maxDist;
  },

  /**
   * Activity score based on how recently each user was active.
   * Both users active within the last 24 h ⇒ 1, >30 days ⇒ 0.
   */
  _activityScore(userA, userB) {
    const now = Date.now();

    const recencyA = this._recencyValue(userA.lastActiveAt, now);
    const recencyB = this._recencyValue(userB.lastActiveAt, now);

    return (recencyA + recencyB) / 2;
  },

  // Lifestyle compatibility

  _lifestyleScore(userA, userB) {
    const fields = ["drinking", "smoking", "workout", "diet"];
    let compared = 0;
    let matched = 0;

    for (const f of fields) {
      const valA = userA.lifestyle?.[f];
      const valB = userB.lifestyle?.[f];
      if (valA && valB) {
        compared++;
        if (valA === valB) matched++;
      }
    }

    if (compared === 0) return 0.5; // neutral when no data
    return matched / compared;
  },

  // Relationship goal alignment — exact match = 1, else 0.
  // If either hasn't set a goal, return neutral 0.5.

  _relationshipGoalScore(userA, userB) {
    const goalA = userA.relationshipGoal;
    const goalB = userB.relationshipGoal;

    if (!goalA || !goalB) return 0.5;
    return goalA === goalB ? 1 : 0;
  },

  //  Helpers Functions

  // according to last active
  _recencyValue(lastActiveAt, now) {
    if (!lastActiveAt) return 0.1;
    const diffMs = now - new Date(lastActiveAt).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays <= 1) return 1;
    if (diffDays <= 3) return 0.85;
    if (diffDays <= 7) return 0.7;
    if (diffDays <= 14) return 0.5;
    if (diffDays <= 30) return 0.3;
    return 0.1;
  },

  // according to lat long we calculate the distance in kilometers
  _haversineKm([lng1, lat1], [lng2, lat2]) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },
};

module.exports = compatibilityService;
