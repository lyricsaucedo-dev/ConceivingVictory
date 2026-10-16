/**
 * Start GitHub OAuth for Decap CMS.
 * Requires Vercel env: GITHUB_CLIENT_ID
 */
module.exports = function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Missing GITHUB_CLIENT_ID on the server.");
    return;
  }

  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const redirectUri = `${proto}://${host}/api/callback`;

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("scope", "repo,user");
  url.searchParams.set("redirect_uri", redirectUri);

  res.statusCode = 302;
  res.setHeader("Location", url.toString());
  res.end();
};
