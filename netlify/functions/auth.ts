import { Handler } from "@netlify/functions";
import fetch from "node-fetch";

const handler: Handler = async (event) => {
  try {
    const { code } = event.queryStringParameters || {};

    if (!code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing authorization code" }),
      };
    }

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_APP_CLIENT_ID,
        client_secret: process.env.GITHUB_APP_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: data.error_description }),
      };
    }

    // Return token to be used in subsequent requests
    return {
      statusCode: 200,
      body: JSON.stringify({
        token: data.access_token,
        token_type: data.token_type,
      }),
    };
  } catch (error) {
    console.error("Auth error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Authentication failed" }),
    };
  }
};

export { handler };
