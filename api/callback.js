/**
 * Finish GitHub OAuth and hand the token to Decap CMS (popup postMessage).
 * Requires Vercel env: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 */
async function exchangeCode(code, redirectUri) {
  const body = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || "",
    client_secret: process.env.GITHUB_CLIENT_SECRET || "",
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return response.json();
}

function page(status, state, payload) {
  const safeState = JSON.stringify(state);
  const safePayload = JSON.stringify(payload);
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>Signing in…</title></head>
<body>
<script>
(function () {
  var state = ${safeState};
  var payload = ${safePayload};
  function receiveMessage(e) {
    window.opener.postMessage(
      "authorization:github:" + state + ":" + JSON.stringify(payload),
      e.origin
    );
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  if (!clientId || !clientSecret) {
    res.statusCode = 500;
    res.end("Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET on the server.");
    return;
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const redirectUri = `${proto}://${host}/api/callback`;

  const url = new URL(req.url, `${proto}://${host}`);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    res.statusCode = 200;
    res.end(
      page(200, "error", {
        message: url.searchParams.get("error_description") || oauthError,
        provider: "github",
      })
    );
    return;
  }

  if (!code) {
    res.statusCode = 400;
    res.end("Missing OAuth code.");
    return;
  }

  try {
    const data = await exchangeCode(code, redirectUri);
    if (!data.access_token) {
      res.statusCode = 200;
      res.end(
        page(200, "error", {
          message: data.error_description || data.error || "No access token returned",
          provider: "github",
        })
      );
      return;
    }

    res.statusCode = 200;
    res.end(
      page(200, "success", {
        token: data.access_token,
        provider: "github",
      })
    );
  } catch (err) {
    res.statusCode = 500;
    res.end("OAuth exchange failed.");
  }
};
