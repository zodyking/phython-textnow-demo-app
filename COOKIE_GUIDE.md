# Cookie Setup Guide - Based on GitHub Issue #35

## Understanding the 403 Forbidden Error

According to [GitHub Issue #35](https://github.com/joeyagreco/pythontextnow/issues/35), 403 errors are commonly caused by:

1. **Expired Cookies** - SID cookies expire and need to be refreshed
2. **Incorrect Cookie Format** - The cookie must be in the correct format
3. **Username Mismatch** - The username must match exactly

## Cookie Format Requirements

Based on the GitHub issue, the `connect.sid` cookie should be:

### ✅ Correct Format:
```
s%3ANbwet0p_vVIBQbCUgrd_pQ__UaHHu-Db.CguU46n4qKhBdLjd0jHTNFa2Mc1248JDammUCHcwjVo
```

**Key Points:**
- Must start with `s%3A` (URL-encoded `s:`) or `s:`
- Should be URL-encoded (keep `%3A`, `%2F`, etc.)
- Should NOT include `connect.sid=` prefix
- Should NOT include quotes

### ❌ Wrong Formats:
```
connect.sid=s%3A...  (includes prefix)
"s%3A..."            (includes quotes)
s:h1zL9MFK...        (decoded - may not work)
```

## Step-by-Step Cookie Extraction

1. **Go to TextNow.com** and log in
2. **Open Developer Tools** (F12)
3. **Go to Network tab**
4. **Refresh the page** (F5)
5. **Click any request** → **Headers tab**
6. **Find Cookie header** in Request Headers
7. **Copy the entire Cookie string** (all cookies)
8. **Paste in Settings** - our app will extract `connect.sid` automatically

## Common Issues from GitHub Issue #35

### Issue: Cookie doesn't work even when extracted correctly

**Possible Solutions:**
1. **Cookie Expired** - Get a fresh cookie (cookies expire frequently)
2. **Username Format** - If your username has special characters (like periods), make sure it matches exactly
3. **IP Restrictions** - TextNow may restrict access from certain IPs
4. **Multiple Sessions** - Don't use the same cookie in multiple places simultaneously

### Testing Your Cookie

The cookie value should:
- Start with `s%3A` (URL-encoded) or `s:` (decoded)
- Be 50-200 characters long typically
- Contain URL-encoded characters (`%3A`, `%2F`, etc.)

## Our Implementation

Our app automatically:
- ✅ Extracts `connect.sid` from full cookie strings
- ✅ Validates the cookie format
- ✅ Keeps URL-encoding intact (as required)
- ✅ Handles both full cookie headers and just the value

## If You Still Get 403 Errors

1. **Get a Fresh Cookie** - Cookies expire, get a new one from TextNow.com
2. **Check Username** - Verify it matches exactly (case-sensitive, including special characters)
3. **Update Settings** - Go to Settings and paste the fresh cookie
4. **Check Server Logs** - Look at the PowerShell window for detailed error messages

## User Agent Requirement (GitHub Issue #39)

**IMPORTANT:** According to [GitHub Issue #39](https://github.com/joeyagreco/pythontextnow/issues/39), you need the **EXACT user agent** from the browser that was used to obtain the cookie.

### Why This Matters

TextNow now validates that the User-Agent header matches the browser that created the session. If it doesn't match, you'll get 403 errors even with a valid cookie.

### How We Handle It

Our app automatically:
- ✅ Captures your browser's User-Agent when you sign up or update settings
- ✅ Stores it with your account
- ✅ Uses it for all API requests to TextNow

**You don't need to do anything manually** - the app handles this automatically!

## References

- [GitHub Issue #35](https://github.com/joeyagreco/pythontextnow/issues/35) - Cookie format discussion
- [GitHub Issue #39](https://github.com/joeyagreco/pythontextnow/issues/39) - User agent requirement
- [pythontextnow Repository](https://github.com/joeyagreco/pythontextnow) - Main repository

