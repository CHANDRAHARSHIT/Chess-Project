/**
 * filters.ts
 * Player matching and classical time-control / event-name filtering
 * for FIDE classical game extraction.
 *
 * Player matching: FIDE ID first (exact numeric match via WhiteFideId /
 * BlackFideId headers), falling back to alias-based name matching only
 * when FIDE ID headers are absent.
 *
 * Classical filter: cascading TimeControl → event-name check.
 * Missing/unparseable TimeControl falls through to event-name check
 * instead of auto-failing (many real PGN files, including TWIC, often
 * omit TimeControl headers for legitimate classical games).
 */
/**
 * Match a player against PGN headers.
 * Priority: WhiteFideId/BlackFideId (exact numeric) → alias name matching.
 */
export function matchPlayer(headers, targetFideId, aliases) {
    const whiteFideId = headers['WhiteFideId']?.trim();
    const blackFideId = headers['BlackFideId']?.trim();
    const targetIdStr = String(targetFideId);
    // Priority 1: exact FIDE ID match (unambiguous)
    if (whiteFideId === targetIdStr) {
        return { matched: true, color: 'w', method: 'fide_id' };
    }
    if (blackFideId === targetIdStr) {
        return { matched: true, color: 'b', method: 'fide_id' };
    }
    // Priority 2: fall back to alias matching when FIDE ID headers are absent
    if (!whiteFideId && !blackFideId) {
        const whiteName = (headers['White'] || '').toLowerCase().trim();
        const blackName = (headers['Black'] || '').toLowerCase().trim();
        for (const alias of aliases) {
            const lowerAlias = alias.toLowerCase().trim();
            if (whiteName === lowerAlias || whiteName.includes(lowerAlias)) {
                return { matched: true, color: 'w', method: 'alias' };
            }
            if (blackName === lowerAlias || blackName.includes(lowerAlias)) {
                return { matched: true, color: 'b', method: 'alias' };
            }
        }
        // Also try word-based matching (handles "Hikaru Nakamura" vs "Nakamura, Hikaru")
        for (const alias of aliases) {
            const aliasWords = alias.toLowerCase().split(/[\s,]+/).filter(Boolean);
            if (aliasWords.length > 1) {
                if (aliasWords.every(w => whiteName.includes(w))) {
                    return { matched: true, color: 'w', method: 'alias' };
                }
                if (aliasWords.every(w => blackName.includes(w))) {
                    return { matched: true, color: 'b', method: 'alias' };
                }
            }
        }
    }
    return { matched: false, color: null, method: null };
}
/** Minimum base time in seconds for classical (90 minutes) */
const CLASSICAL_BASE_SECONDS = 5400;
/** Minimum base minutes in an event-name numeric TC pattern to NOT auto-exclude.
 *  Anything below this (e.g. "3-0", "5-2", "15-10") is clearly not classical. */
const MIN_EVENT_TC_MINUTES_CLASSICAL = 30;
/** Event name keywords that indicate non-classical (case-insensitive) */
const EVENT_EXCLUDE_KEYWORDS = [
    'blitz', 'rapid', 'bullet', 'online', 'arena', 'speed', 'lightning',
];
/** Event name keywords/patterns that indicate classical (case-insensitive) */
const EVENT_INCLUDE_KEYWORDS = [
    'classical', 'candidates', 'world championship', 'olympiad',
    'grand prix', 'grand swiss', 'sinquefield', 'tata steel',
    'norway chess', 'wijk aan zee', 'superbet',
];
/**
 * Known online platform markers in Event or Site headers.
 * If detected, the event is treated with suspicion — an "unclassified"
 * event from an online platform defaults to EXCLUDED (not included),
 * since real FIDE classical tournaments essentially never have these.
 */
const ONLINE_PLATFORM_MARKERS = [
    'chess.com', 'lichess.org', 'chess24', 'playchess',
    'icc ', 'internet chess',
];
/**
 * Detect chess.com-style numeric time-control patterns in event names.
 * Examples: "1st 3-0 Thu ...", "Weekly 5-2 ...", "10-0 Rated"
 * Pattern: a word boundary followed by 1-3 digit number, dash, 1-2 digit number.
 * Returns the base minutes if matched and below classical threshold, else null.
 */
function detectEventNameTC(eventName) {
    // Match patterns like "3-0", "5-2", "15-10", "10-0" at word boundaries
    const match = eventName.match(/\b(\d{1,3})-(\d{1,2})\b/);
    if (!match)
        return null;
    const minutes = parseInt(match[1], 10);
    const increment = parseInt(match[2], 10);
    // Sanity check: only treat as a TC pattern if the minutes value is
    // in a plausible range for a chess time control (1-180 minutes).
    // This avoids false positives on date-like patterns ("2026-07") or
    // round numbers ("1-2").
    if (minutes < 1 || minutes > 180)
        return null;
    return { minutes, increment };
}
/**
 * Check if the Event or Site headers suggest an online platform.
 */
function isOnlinePlatform(eventName, siteName) {
    const combined = `${eventName} ${siteName}`.toLowerCase();
    for (const marker of ONLINE_PLATFORM_MARKERS) {
        if (combined.includes(marker)) {
            return marker;
        }
    }
    return null;
}
/**
 * Parse a TimeControl header value.
 * Handles common formats: "5400+30", "7200", "5400+30:1800+30", etc.
 * Returns base time in seconds of the first period, or null if unparseable.
 */
function parseTimeControl(tc) {
    if (!tc || tc === '-' || tc === '?')
        return null;
    // Handle multi-period TCs like "5400+30:1800+30" — use first period
    const firstPeriod = tc.split(':')[0];
    const match = firstPeriod.match(/^(\d+)(?:\+(\d+))?$/);
    if (match) {
        return parseInt(match[1], 10);
    }
    // Handle "moves/seconds" format like "40/5400"
    const movesMatch = firstPeriod.match(/^\d+\/(\d+)$/);
    if (movesMatch) {
        return parseInt(movesMatch[1], 10);
    }
    return null;
}
/**
 * Apply the cascading classical filter.
 *
 * 1. If TimeControl is present and parseable:
 *    - base >= 5400s → PASS (classical by TC)
 *    - base < 5400s  → FAIL (time control too low)
 *
 * 2. If TimeControl is absent/unparseable, fall through to event/site checks:
 *    a. Numeric TC pattern in event name (e.g. "3-0") → FAIL if < 30 min
 *    b. Keyword exclude list (blitz/rapid/bullet/online) → FAIL
 *    c. Keyword include list (candidates/olympiad/etc.) → PASS
 *    d. Online platform detected → FAIL (default-exclude for online platforms)
 *    e. None of the above → PASS (unclassified OTB event, included by default)
 */
export function classicalFilter(timeControl, eventName, siteName = '') {
    // ── Pass 1: TimeControl header ──
    const baseTime = parseTimeControl(timeControl);
    if (baseTime !== null) {
        if (baseTime >= CLASSICAL_BASE_SECONDS) {
            return {
                passed: true,
                reason: `Classical by time control (${baseTime}s base)`,
                method: 'time_control',
            };
        }
        else {
            return {
                passed: false,
                reason: `Time control too low (${baseTime}s < ${CLASSICAL_BASE_SECONDS}s)`,
                method: 'time_control',
            };
        }
    }
    // ── Pass 2: Event name (fallback when TC is absent/unparseable) ──
    const eventLower = eventName.toLowerCase();
    // 2a. Check for chess.com-style numeric TC pattern in event name
    const eventTC = detectEventNameTC(eventName);
    if (eventTC && eventTC.minutes < MIN_EVENT_TC_MINUTES_CLASSICAL) {
        return {
            passed: false,
            reason: `Event name contains time control "${eventTC.minutes}-${eventTC.increment}" (${eventTC.minutes} min < ${MIN_EVENT_TC_MINUTES_CLASSICAL} min classical threshold) in "${eventName}"`,
            method: 'event_exclude',
        };
    }
    // 2b. Check keyword exclude list
    for (const keyword of EVENT_EXCLUDE_KEYWORDS) {
        if (eventLower.includes(keyword)) {
            return {
                passed: false,
                reason: `Excluded event type: "${keyword}" in "${eventName}"`,
                method: 'event_exclude',
            };
        }
    }
    // 2c. Check keyword include list (takes priority over platform suspicion)
    for (const keyword of EVENT_INCLUDE_KEYWORDS) {
        if (eventLower.includes(keyword)) {
            return {
                passed: true,
                reason: `Classical by event name: "${keyword}" in "${eventName}"`,
                method: 'event_include',
            };
        }
    }
    // 2d. If the event/site suggests an online platform and nothing above
    // matched the include list, default to EXCLUDE — real FIDE classical
    // tournaments don't come from chess.com/lichess/etc.
    const platformMarker = isOnlinePlatform(eventName, siteName);
    if (platformMarker) {
        return {
            passed: false,
            reason: `Online platform detected ("${platformMarker}") with unclassified event name: "${eventName}" — excluded by default`,
            method: 'event_exclude',
        };
    }
    // 2e. Neither list matched, no online platform — include by default
    // to avoid dropping legitimate OTB classical games from lesser-known tournaments
    return {
        passed: true,
        reason: `Unclassified event, included by default: "${eventName}"`,
        method: 'event_default',
    };
}
