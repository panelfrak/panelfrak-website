import { Handler } from "@netlify/functions";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client for Backblaze B2
const getS3Client = () => {
  const endpoint = process.env.B2_ENDPOINT || "https://s3.us-east-005.backblazeb2.com";
  const region = process.env.B2_REGION || "auto";
  
  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: process.env.B2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.B2_SECRET_ACCESS_KEY as string,
    },
    forcePathStyle: true, // Required for B2 and other S3-compatible services
  });
};

const handler: Handler = async (event) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  try {
    const bucket = process.env.B2_BUCKET || "panelfrak-assets";
    const s3Client = getS3Client();
    
    // Verify credentials are configured
    if (!process.env.B2_ACCESS_KEY_ID || !process.env.B2_SECRET_ACCESS_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "B2 credentials not configured" }),
      };
    }

    const path = event.path.replace("/.netlify/functions/s3", "");
    
    // Handle different HTTP methods
    switch (event.httpMethod) {
      case "GET": {
        // List objects or get signed URL
        if (event.queryStringParameters?.list) {
          const prefix = event.queryStringParameters.prefix || "";
          const command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            MaxKeys: 1000,
          });
          
          const response = await s3Client.send(command);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              objects: response.Contents?.map(obj => ({
                key: obj.Key,
                size: obj.Size,
                lastModified: obj.LastModified,
                url: `https://f005.backblazeb2.com/file/${bucket}/${obj.Key}`,
              })) || [],
            }),
          };
        }
        
        // Get signed URL for viewing
        const key = path.substring(1); // Remove leading slash
        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
        });
        
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ url: signedUrl }),
        };
      }

      case "POST":
      case "PUT": {
        // Upload file
        const contentType = event.headers["content-type"] || "application/octet-stream";
        const key = path.substring(1) || event.queryStringParameters?.key;
        
        if (!key) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Missing file key" }),
          };
        }

        // Parse body (handle base64 encoding from API Gateway)
        let fileContent: Buffer;
        if (event.isBase64Encoded) {
          fileContent = Buffer.from(event.body || "", "base64");
        } else {
          fileContent = Buffer.from(event.body || "", "utf-8");
        }

        const command = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileContent,
          ContentType: contentType,
          ACL: "public-read", // Make files publicly accessible
        });

        await s3Client.send(command);
        
        // Return public URL
        const publicUrl = `https://f005.backblazeb2.com/file/${bucket}/${key}`;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true,
            url: publicUrl,
            key: key,
          }),
        };
      }

      case "DELETE": {
        // Delete file
        const key = path.substring(1) || event.queryStringParameters?.key;
        
        if (!key) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Missing file key" }),
          };
        }

        const command = new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        });

        await s3Client.send(command);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true }),
        };
      }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: "Method not allowed" }),
        };
    }
  } catch (error: any) {
    console.error("S3 operation error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "S3 operation failed",
        message: error.message,
      }),
    };
  }
};

export { handler };
