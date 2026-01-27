import { Handler } from "@netlify/functions";
import fetch from "node-fetch";

function getBaseUrl(event: any): string {
  const proto = (event.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (event.headers.host || "").split(",")[0].trim();
  if (host) return `${proto}://${host}`;
  return process.env.DEPLOY_PRIME_URL || process.env.URL || "";
}

const handler: Handler = async (event) => {
  try {
    // Basic CORS support for local testing if needed
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        },
        body: "",
      };
    }

    const qs = event.queryStringParameters || {};
    const code = qs.code as string | undefined;
    const scope = (qs.scope as string) || "repo,user";
    const clientId = process.env.GITHUB_APP_CLIENT_ID as string;
    const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET as string;

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server not configured: missing GitHub app credentials" }),
      };
    }

    const baseUrl = getBaseUrl(event);
    const redirectUri = `${baseUrl}/.netlify/functions/auth`;

    // Step 1: No code -> redirect to GitHub OAuth authorize
    if (!code) {
      const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
      authorizeUrl.searchParams.set("client_id", clientId);
      authorizeUrl.searchParams.set("redirect_uri", redirectUri);
      authorizeUrl.searchParams.set("scope", scope);
      if (qs.state) authorizeUrl.searchParams.set("state", String(qs.state));

      return {
        statusCode: 302,
        headers: { Location: authorizeUrl.toString() },
        body: "",
      };
    }

    // Step 2: We have ?code -> exchange for access token
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });

    const data = (await response.json()) as any;
    if (data.error || !data.access_token) {
      const desc = data.error_description || data.error || "Unknown error";
      return { statusCode: 401, body: JSON.stringify({ error: desc }) };
    }

    // Return a small HTML page that posts the token back to the CMS window
    const html = `<!doctype html><html><head><meta charset="utf-8"/></head><body>
<script>
(function(){
  var payload = { token: ${JSON.stringify(data.access_token)}, provider: 'github' };
  var msg = 'authorization:github:success:' + JSON.stringify(payload);
  try {
    if (window.opener) {
      window.opener.postMessage(msg, '*');
      window.close();
    } else {
      document.body.innerText = 'Authentication successful. You can close this window.';
    }
  } catch (e) {
    document.body.innerText = 'Authentication complete. Please return to the app.';
  }
})();
</script>
</body></html>`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: html,
    };
  } catch (error) {
    console.error("Auth error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Authentication failed" }) };
  }
};

export { handler };
