import { Handler } from "@netlify/functions";
import { Octokit } from "@octokit/rest";

const handler: Handler = async (event) => {
  try {
    const token = event.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Missing token" }),
      };
    }

    const octokit = new Octokit({ auth: token });
    const { owner, repo, path, message, content, sha } = JSON.parse(
      event.body || "{}"
    );

    if (event.httpMethod === "GET") {
      // Get file content
      const result = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      return {
        statusCode: 200,
        body: JSON.stringify(result.data),
      };
    } else if (event.httpMethod === "PUT") {
      // Create or update file
      const result = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString("base64"),
        sha,
      });
      return {
        statusCode: 200,
        body: JSON.stringify(result.data),
      };
    } else if (event.httpMethod === "DELETE") {
      // Delete file
      const result = await octokit.repos.deleteFile({
        owner,
        repo,
        path,
        message,
        sha,
      });
      return {
        statusCode: 200,
        body: JSON.stringify(result.data),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Git operation error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Git operation failed" }),
    };
  }
};

export { handler };
