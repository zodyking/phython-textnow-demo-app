# Troubleshooting Guide

## Common Errors

### 403 Forbidden Error

**Error Message:** `403 Client Error: Forbidden for url: https://www.textnow.com/api/users/[username]/messages`

**Causes:**
1. **Invalid or Expired SID Cookie** - The `connect.sid` cookie has expired or is invalid
2. **Incorrect Cookie Format** - The cookie value includes extra text like "connect.sid="
3. **Wrong Username** - The TextNow username doesn't match the cookie

**Solutions:**

1. **Get a Fresh SID Cookie:**
   - Go to [TextNow.com](https://www.textnow.com) and log in
   - Open Developer Tools (F12)
   - Go to the **Network** tab
   - Refresh the page or navigate to the messages page
   - Find any request (look for XHR/Fetch requests)
   - Click on the request → **Headers** tab
   - Scroll to **Request Headers** → find **Cookie**
   - Look for `connect.sid=...` 
   - Copy **ONLY the value** after `connect.sid=` (not including "connect.sid=")
   - Example: If you see `connect.sid=s%3Aabc123...`, copy `s%3Aabc123...`

2. **Update Your Account:**
   - Go to your account settings in the app
   - Update the SID Cookie field with the fresh cookie value
   - Make sure there are no extra spaces or quotes

3. **Verify Your Username:**
   - Make sure the TextNow username matches exactly (case-sensitive)
   - This is the username you use to log into TextNow, not your email

### Phone Number Format Errors

**Error Message:** `'[number]' is not a possible phone number`

**Solution:**
- Enter phone numbers in one of these formats:
  - 10-digit US number: `2122037678` (auto-converts to +12122037678)
  - Full E.164 format: `+12122037678`
  - 11-digit starting with 1: `12122037678` (auto-converts to +12122037678)

### JSON Parsing Errors

**Error Message:** `Failed to parse response: Unexpected token...`

**Solution:**
- This should be fixed in the latest version
- If you still see this, check the server logs for the raw Python output
- Make sure Python dependencies are installed: `pip install pythontextnow random-user-agent`

## Getting Your SID Cookie (Step-by-Step)

1. **Open TextNow.com** in your browser
2. **Log in** to your TextNow account
3. **Open Developer Tools:**
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
4. **Go to Network Tab:**
   - Click on the "Network" tab in Developer Tools
5. **Refresh the Page:**
   - Press `F5` or click the refresh button
   - You should see requests appearing in the Network tab
6. **Find a Request:**
   - Look for requests to `textnow.com` or `api.textnow.com`
   - Click on any request
7. **Get the Cookie:**
   - Click on the **Headers** tab
   - Scroll down to **Request Headers**
   - Find the **Cookie** header
   - Look for `connect.sid=...`
   - Copy the value after the `=` sign
   - Example: `s%3Aabc123def456...`

## Cookie Format

The SID cookie should look like:
- ✅ Correct: `s%3Aabc123def456ghi789...`
- ❌ Wrong: `connect.sid=s%3Aabc123...` (includes "connect.sid=")
- ❌ Wrong: `"s%3Aabc123..."` (includes quotes)

## Testing Your Credentials

You can test if your credentials work by:

1. Making sure you can log into TextNow.com with your username
2. Verifying the SID cookie is fresh (get it right before using it)
3. Checking that the cookie value doesn't have extra characters

## Still Having Issues?

1. **Check Server Logs:** Look at the PowerShell window running the dev server for detailed error messages
2. **Verify Python Installation:** Run `python -c "from pythontextnow import Client; print('OK')"`
3. **Check Dependencies:** Run `pip install pythontextnow random-user-agent`
4. **Cookie Expiration:** SID cookies can expire. Get a fresh one if you're getting 403 errors

