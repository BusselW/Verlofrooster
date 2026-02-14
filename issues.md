# Verlofrooster - Code Analysis Issues

**Analysis Date:** 2026-02-14
**Project:** Verlofrooster (SharePoint-hosted React 18 SPA for employee leave management)
**Total Issues Found:** 27

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 3 |
| High | 5 |
| Medium | 10 |
| Low | 9 |

---

## Critical Issues

### 1. XSS via innerHTML in Error Handler Notifications

**File:** `pages/js/errorHandler.js:237-243`
**Severity:** CRITICAL

The `displayNotification` method injects `notification.title` and `notification.message` directly into the DOM using `innerHTML`:

```javascript
notificationElement.innerHTML = `
    <div class="verli-notification-header">
        <h4 class="verli-notification-title">${notification.title}</h4>
        <button class="verli-notification-close" onclick="this.parentElement.parentElement.remove()">x</button>
    </div>
    <div class="verli-notification-content">${notification.message}</div>
`;
```

If `notification.message` contains content derived from SharePoint API error responses or user-influenced data, an attacker could inject malicious HTML/JavaScript.

**Recommendation:** Use `document.createElement()` and `textContent` to safely render notification content.

---

### 2. XSS via innerHTML in App Error Display

**File:** `js/app.js:132-144, 170-185`
**Severity:** CRITICAL

The `initializeApp` function and the outer catch block both inject `error.message` and `error.stack` into the DOM using `innerHTML`:

```javascript
container.innerHTML = `
    ...
    <p style="...">${error.message}</p>
    ...
    <pre ...>${error.message}\n\n${error.stack}</pre>
    ...
`;
```

Error messages originating from network responses or SharePoint API failures could contain attacker-controlled content (e.g., reflected values in error messages), leading to XSS execution.

**Recommendation:** Use `textContent` for error messages or sanitize before rendering into `innerHTML`.

---

### 3. OData Injection in Admin User Search

**File:** `pages/adminCentrum/js/userManager.js:75-80`
**Severity:** CRITICAL

User input is used to construct OData filter queries with only `encodeURIComponent()` as protection:

```javascript
const zoekMethodes = [
    `LoginName eq '${encodeURIComponent(formateerGebruikersnaamVoorOpslaan(gesaneerdInput))}'`,
    `Title eq '${encodeURIComponent(inputWaarde)}'`,
    `substringof('${encodeURIComponent(gesaneerdInput)}', LoginName)`,
    `substringof('${encodeURIComponent(inputWaarde)}', Title)`
];
```

`encodeURIComponent()` does **not** prevent OData injection. Single quotes within OData filters must be escaped with double single quotes (`''`). An attacker could inject OData logical operators to access unauthorized data.

**Recommendation:** Properly escape OData filter values: `value.replace(/'/g, "''")` and also URL-encode the entire filter parameter.

---

## High Severity Issues

### 4. Hardcoded SharePoint URLs in Multiple Files

**Files:**
- `js/services/sharepointCRUD.js:13` - `"https://som.org.om.local/sites/MulderT/CustomPW/Verlof/_api/contextinfo"`
- `js/services/sharepointCRUD.js:36` - Hardcoded in `roepSharePointApi`
- `js/ui/contextmenu.js:559` - Hardcoded in `getListItemById`
- `js/services/linkInfo.js:602` - Fallback URL

**Severity:** HIGH

Multiple files contain hardcoded internal infrastructure URLs as primary endpoints or fallbacks. The `sharepointCRUD.js` file uses hardcoded URLs exclusively rather than reading from configuration, while other files like `sharepointService.js` correctly use `window.appConfiguratie.instellingen.siteUrl`.

**Impact:** Exposes internal infrastructure details. Code cannot be deployed to different SharePoint environments without modification. The inconsistency means some operations may fail if the hardcoded URL becomes unreachable.

**Recommendation:** Replace all hardcoded URLs with `window.appConfiguratie.instellingen.siteUrl` consistently across all files.

---

### 5. Unvalidated List Names in API URL Construction

**Files:**
- `js/services/sharepointCRUD.js:80, 102, 128, 155`
- `js/services/sharepointService.js:179, 277, 302, 398, 435`
- `pages/beheerCentrum/js/dataService.js:21, 71, 111, 142, 184, 214`

**Severity:** HIGH

List names are interpolated directly into API URLs without any validation or whitelist check:

```javascript
const endpoint = `lists/getbytitle('${lijstNaam}')/items`;
```

If list names are ever derived from user input or URL parameters, this enables API endpoint manipulation.

**Recommendation:** Validate list names against a whitelist of known list names from `configLijst.js` before using them in API calls.

---

### 6. No Optimistic Locking on Updates (Lost Update Problem)

**Files:**
- `js/services/sharepointCRUD.js:130` - `"IF-MATCH": "*"`
- `js/services/sharepointService.js:407` - `'IF-MATCH': '*'`
- `pages/beheerCentrum/js/dataService.js:154` - `'IF-MATCH': '*'`

**Severity:** HIGH

All update (MERGE) operations use `IF-MATCH: *` which unconditionally overwrites items regardless of whether they have been modified by another user since they were loaded:

```javascript
const extraHeaders = {
    "IF-MATCH": "*",
    "X-HTTP-Method": "MERGE"
};
```

In a multi-user leave management system, this creates a real risk of lost updates when two users modify the same leave request simultaneously.

**Recommendation:** Store the ETag value returned when items are fetched and use it in the `IF-MATCH` header to implement optimistic concurrency control.

---

### 7. No SharePoint List Pagination Support

**Files:**
- `js/services/sharepointService.js:179` - `$top=5000`
- `js/services/sharepointService.js:277` - `$top=5000`

**Severity:** HIGH

All list data fetches use `$top=5000` without any `$skiptoken` handling:

```javascript
const apiUrl = `${siteUrl}/_api/web/lists/getbytitle('${lijstTitel}')/items?$top=5000`;
```

SharePoint REST API returns a maximum of 5000 items per request. If any list (especially Verlof or CompensatieUren) exceeds 5000 records, data is silently truncated without error or warning.

**Recommendation:** Implement pagination using `$skiptoken` from the `odata.nextLink` response property to retrieve all items, or implement server-side filtering to keep result sets under 5000.

---

### 8. Permission Cache Race Condition

**File:** `js/services/permissionService.js:23-56`
**Severity:** HIGH

The `getCurrentUserGroups()` function checks a module-level cache but does not prevent concurrent callers from triggering duplicate fetches:

```javascript
export async function getCurrentUserGroups() {
    if (userGroupsCache !== null) {
        return userGroupsCache;
    }
    // Multiple callers can reach here before the first fetch completes
    const response = await fetch(apiUrl, ...);
    ...
    userGroupsCache = data.value ? data.value.map(group => group.Title) : [];
    return userGroupsCache;
}
```

If multiple components call `getCurrentUserGroups()` simultaneously before the first fetch completes, all of them will trigger separate API calls. Additionally, the cache has no TTL, so permission changes during a session are never reflected.

**Recommendation:** Store the pending promise so concurrent callers share the same request. Consider adding a cache TTL (e.g., 5 minutes) for long-lived sessions.

---

## Medium Severity Issues

### 9. Promise.all Without Partial Failure Handling

**File:** `js/services/dataFetcher.js:42-54`
**Severity:** MEDIUM

Static data is fetched using `Promise.all`, which rejects entirely if any single fetch fails:

```javascript
const [medewerkersData, teamsData, verlofredenenData, urenPerWeekData, dagenIndicatorsData]
    = await Promise.all([
        fetchFunction('Medewerkers'),
        fetchFunction('Teams'),
        fetchFunction('Verlofredenen'),
        fetchFunction('UrenPerWeek'),
        fetchFunction('DagenIndicators')
    ]);
```

If `Teams` fails to load, `Medewerkers` (which succeeded) is also lost, and the entire application fails to initialize.

**Recommendation:** Use `Promise.allSettled()` and handle individual failures gracefully, or wrap each fetch in its own try-catch.

---

### 10. Silent Failures Return Empty Arrays Instead of Errors

**File:** `js/services/sharepointService.js:159-198`
**Severity:** MEDIUM

The `fetchSharePointList` function catches all errors and returns an empty array:

```javascript
export async function fetchSharePointList(lijstNaam) {
    try {
        if (!window.appConfiguratie || !window.appConfiguratie.instellingen) {
            console.warn('App configuratie niet gevonden. Fallback naar lege lijst.');
            return [];  // Silent failure
        }
        ...
    } catch (error) {
        console.error(`Fout bij ophalen van lijst ${lijstNaam}:`, error);
        return [];  // Silent failure
    }
}
```

Callers cannot distinguish between "list is legitimately empty" and "fetch failed due to an error." This leads to the application displaying an empty calendar with no indication that data failed to load.

**Recommendation:** Throw errors or return a result object that distinguishes success from failure (e.g., `{ data: [], error: null }` vs `{ data: null, error: 'Network error' }`).

---

### 11. Request Digest Not Cached or Refreshed

**File:** `js/services/sharepointService.js:249-265`
**Severity:** MEDIUM

Every write operation fetches a new request digest by calling `/_api/contextinfo`:

```javascript
async function getRequestDigest() {
    const apiUrl = `${siteUrl.replace(/\/$/, '')}/_api/contextinfo`;
    const response = await fetch(apiUrl, { method: 'POST', ... });
    ...
    return data.FormDigestValue;
}
```

This doubles the API calls for every create/update/delete operation. SharePoint request digests are valid for ~30 minutes, so they should be cached and reused.

**Recommendation:** Cache the digest value with its expiration timestamp and only refresh when expired.

---

### 12. Sensitive Data Logged to Console in Production

**Files:**
- `js/components/UserRegistrationCheck.js:11` - `const DEBUG_MODE = true;`
- `js/services/sharepointService.js:224, 304-306` - Logs raw user data and request details
- `pages/beheerCentrum/js/dataService.js:286-335` - Extensive console.log of search queries and responses
- `js/services/linkInfo.js:608-618` - Debug logging keyed to specific username

**Severity:** MEDIUM

`DEBUG_MODE` is hardcoded to `true` in `UserRegistrationCheck.js`. Throughout the codebase, sensitive data including user login names, email addresses, API URLs, and request data is logged to the browser console unconditionally.

**Impact:** Exposes user PII and internal API structure to anyone who opens browser developer tools.

**Recommendation:** Set `DEBUG_MODE = false` for production. Implement a centralized logging utility that respects environment-based log levels.

---

### 13. Duplicate SharePoint Service Implementations

**Files:**
- `js/services/sharepointService.js` - Main ES6 module service (486 lines)
- `js/services/sharepointCRUD.js` - Separate CRUD service with hardcoded URLs (173 lines)
- `pages/beheerCentrum/js/dataService.js` - BeheerCentrum-specific service (486 lines)
- `pages/adminCentrum/js/dataService.js` - AdminCentrum-specific service
- `pages/FeedbackForum/js/services/sp-service.js` - FeedbackForum service
- `pages/meldingenCentrum/js/services/sp-service.js` - MeldingenCentrum service

**Severity:** MEDIUM

There are at least 6 different implementations of SharePoint REST API interaction. Each has different error handling patterns, different OData format modes (`verbose` vs `nometadata`), different URL construction approaches, and different validation strategies.

**Impact:** Bugs fixed in one service are not automatically fixed in others. Security improvements (like input validation) must be applied to every copy independently.

**Recommendation:** Consolidate into a single shared SharePoint service module imported by all pages.

---

### 14. Random ID Generation for User Objects

**File:** `pages/beheerCentrum/js/dataService.js:400`
**Severity:** MEDIUM

The alternative search method generates random IDs for user objects:

```javascript
return {
    Id: Math.random(), // Generate temporary ID
    Title: getCell('PreferredName'),
    Email: getCell('WorkEmail'),
    LoginName: getCell('AccountName'),
    PrincipalType: 1
};
```

Using `Math.random()` as an ID is problematic: it generates floating-point numbers between 0 and 1, not integers. If these IDs are later used for SharePoint API operations (update/delete), they will fail or operate on the wrong items.

**Recommendation:** Use a clearly non-colliding temporary ID scheme (e.g., negative integers) and ensure these objects are never passed to CRUD operations without resolving to real SharePoint IDs.

---

### 15. Incomplete Form Input Validation

**Files:**
- `js/services/sharepointService.js:309-326` - Only validates `Verlof` list fields
- `js/ui/forms/VerlofAanvraagForm.js` - Date parsing without format validation
- `js/ui/forms/CompensatieUrenForm.js` - No hours validation
- `js/ui/forms/ZiekteMeldingForm.js` - No required field validation

**Severity:** MEDIUM

Field validation is only implemented for the `Verlof` list in `createSharePointListItem`:

```javascript
if (listName === 'Verlof') {
    const requiredFields = ['Title', 'Medewerker', 'MedewerkerID', 'StartDatum', 'EindDatum'];
    const missingFields = requiredFields.filter(field => !itemData[field]);
    ...
}
```

Other lists (`CompensatieUren`, `IncidenteelZittingVrij`, `Ziekte`) have no server-side validation, and client-side form validation is inconsistent. The validation using `!itemData[field]` also treats `0` and `false` as missing values.

**Recommendation:** Add validation for all list types. Use explicit null/undefined checks instead of truthiness checks. Add date range validation (start <= end).

---

### 16. Missing AbortController for Fetch Requests

**Files:** All files using `fetch()` (sharepointService.js, sharepointCRUD.js, dataService.js, permissionService.js, etc.)
**Severity:** MEDIUM

No fetch requests use `AbortController`, which means:
- Navigation away from a page cannot cancel pending requests
- Component unmounting in React leaves pending fetches that update stale state
- Long-running requests cannot be timed out client-side

**Recommendation:** Use `AbortController` with fetch requests. In React components, abort pending requests in `useEffect` cleanup functions.

---

### 17. Import After Export in Context Menu

**File:** `js/ui/contextmenu.js:577`
**Severity:** MEDIUM

An `import` statement appears at the bottom of the file after `export default`:

```javascript
export default ContextMenuN;

// Import existing CRUD functions
import { createListItem, updateListItem, deleteListItem } from '../services/sharepointCRUD.js';
```

While ES6 module imports are hoisted, placing an `import` after `export default` is non-standard, confusing, and may cause issues in some module systems. The imported functions are used by `performRestrictedCRUDOperation` defined earlier in the file.

**Recommendation:** Move the import statement to the top of the file with other imports.

---

### 18. Hardcoded Privileged Group Names

**File:** `js/ui/contextmenu.js:14-19`
**Severity:** MEDIUM

Permission group names are hardcoded as string literals:

```javascript
const PRIVILEGED_GROUPS = [
    "1. Sharepoint beheer",
    "1.1. Mulder MT",
    "2.6 Roosteraars",
    "2.3. Senioren beoordelen"
];
```

If SharePoint group names are changed (even minor formatting), permission checks silently fail and users lose access without any error indication.

**Recommendation:** Load group names from configuration (e.g., from the `gemachtigdenLijst` SharePoint list) rather than hardcoding them. Use case-insensitive comparison as a safety measure.

---

## Low Severity Issues

### 19. Inconsistent Error Message Language

**Files:** Throughout the codebase
**Severity:** LOW

Error messages mix Dutch and English inconsistently:
- Dutch: `"Fout bij ophalen van lijst"` (sharepointService.js)
- English: `"SharePoint service not available"` (dataFetcher.js)
- Mixed: `"Could not fetch item ${itemId} from ${listName}"` (contextmenu.js)
- Emoji-prefixed: `"🚫 Je hebt geen rechten..."` (contextmenu.js)

**Recommendation:** Standardize on a single language for all error messages and use a consistent formatting approach.

---

### 20. Excessive Console Logging

**Files:** Nearly every source file
**Severity:** LOW

The codebase contains extensive `console.log` statements with emoji prefixes throughout production code paths:

```javascript
console.log('📊 Fetching static SharePoint lists...');
console.log('✅ Static data fetched successfully');
console.log('🔄 Starting data fetch...');
console.log('⏳ Waiting for appConfiguratie...');
```

This creates noise in the browser console and can impact performance with large datasets.

**Recommendation:** Implement a centralized logger with configurable log levels. Remove or downgrade verbose logging in production builds.

---

### 21. Missing ARIA Attributes for Accessibility

**Files:**
- `js/ui/contextmenu.js` - Context menu lacks `role="menu"` and `role="menuitem"`
- `pages/beheerCentrum/js/ui/Autocomplete.js` - Dropdown lacks `role="listbox"` and `role="option"`
- `js/ui/forms/*.js` - Form elements missing `aria-required`, `aria-invalid` attributes

**Severity:** LOW

Interactive components lack proper ARIA roles and attributes, making the application difficult to use with screen readers and other assistive technologies.

**Recommendation:** Add appropriate ARIA roles (`menu`, `menuitem`, `listbox`, `option`, `dialog`) and states (`aria-expanded`, `aria-selected`, `aria-required`) to interactive components.

---

### 22. Permission Check Errors Default to Denial Without User Feedback

**File:** `js/services/permissionService.js:51-55, 135-138`
**Severity:** LOW

When permission checks fail (e.g., network error), errors are silently caught and defaulted to `false` (no access):

```javascript
} catch (error) {
    console.error('Fout bij ophalen van gebruikersgroepen:', error);
    userGroupsCache = [];  // Cache the empty result - future calls won't retry
    return userGroupsCache;
}
```

Users see missing features or empty menus with no explanation. The empty array is cached, meaning the permission system won't retry even if the network recovers.

**Recommendation:** Don't cache failed results. Show a user-facing notification when permission checks fail. Implement retry logic for transient network failures.

---

### 23. Potential Memory Leak in Tooltip Manager

**File:** `js/ui/tooltipbar.js`
**Severity:** LOW

The TooltipManager uses a MutationObserver and `window.addEventListener('react-update', ...)` to re-attach tooltips on DOM changes. These global listeners are never cleaned up, and tooltip re-attachment runs on every React render cycle via `setTimeout`.

**Recommendation:** Implement proper cleanup in the TooltipManager. Consider using React refs instead of global DOM observation.

---

### 24. Date Utility Functions Lack Timezone Safety

**File:** `js/utils/dateTimeUtils.js`
**Severity:** LOW

Date manipulation functions parse and format dates without explicit timezone handling. SharePoint stores dates in UTC, but the application displays them in local time. Time-zone-related off-by-one-day errors can occur when users are in different timezones than the server.

**Recommendation:** Explicitly handle timezone conversions when parsing dates from SharePoint and formatting them for display.

---

### 25. Hardcoded Debug User Check

**File:** `js/services/linkInfo.js:607-618`
**Severity:** LOW

Debug logging is conditionally enabled for a specific username:

```javascript
const isDebugUser = currentUser.LoginName?.toLowerCase().includes('busselw') ||
                   currentUser.Email?.toLowerCase().includes('busselw');
if (isDebugUser) {
    console.log('Debug Info:', { baseUrl, source, configSiteUrl, currentLocation });
}
```

This is a developer convenience left in production code. It exposes configuration details to a specific user and suggests the codebase may contain other developer-specific logic.

**Recommendation:** Remove user-specific debug checks. Use a proper feature flag or debug mode setting.

---

### 26. Inconsistent SharePoint OData Modes

**Files:**
- `js/services/sharepointService.js` - Uses `odata=nometadata`
- `js/services/sharepointCRUD.js` - Uses `odata=verbose`
- `pages/beheerCentrum/js/dataService.js` - Uses `odata=verbose`

**Severity:** LOW

Different service files request different OData response formats. `nometadata` returns `{ value: [...] }` while `verbose` returns `{ d: { results: [...] } }`. This means response parsing logic must differ between services, increasing complexity and the risk of bugs when code is shared or refactored.

**Recommendation:** Standardize on a single OData mode (preferably `nometadata` for smaller payloads) across all SharePoint service files.

---

### 27. Main App Component Exceeds Maintainable Size

**File:** `js/core/roosterApp.js` (2,257 lines)
**Severity:** LOW

The main application component at 2,257 lines contains all state management, data loading, form handling, and rendering logic in a single file. This makes the code difficult to navigate, test, and maintain.

**Recommendation:** Extract state management into custom hooks. Move form logic into separate modules. Split the rendering into sub-components. This is acknowledged in the project's own `PHASE2_OPTIMIZATION_PLAN.md`.

---

## Recommended Remediation Priority

### Immediate (Critical)
1. Fix innerHTML XSS vulnerabilities in `errorHandler.js` and `app.js` (Issues #1, #2)
2. Fix OData injection in `userManager.js` (Issue #3)

### Short-Term (High)
3. Replace hardcoded URLs with configuration (Issue #4)
4. Add list name validation/whitelist (Issue #5)
5. Implement optimistic locking for updates (Issue #6)
6. Add pagination for large lists (Issue #7)
7. Fix permission cache race condition (Issue #8)

### Medium-Term
8. Add partial failure handling for data loading (Issue #9)
9. Improve error propagation instead of silent failures (Issue #10)
10. Cache request digest with TTL (Issue #11)
11. Disable debug logging in production (Issue #12)
12. Consolidate duplicate SharePoint services (Issue #13)
13. Add comprehensive form validation (Issue #15)

### Long-Term
14. Add AbortController to fetch calls (Issue #16)
15. Add ARIA attributes for accessibility (Issue #21)
16. Refactor roosterApp.js into smaller modules (Issue #27)
