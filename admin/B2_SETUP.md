# Backblaze B2 Auto-Upload Setup for Sveltia CMS

## Overview

Your site now has automatic upload integration with Backblaze B2! Files uploaded through Sveltia CMS will be automatically sent to your B2 bucket via a secure Netlify serverless function.

## Quick Setup (3 Steps)

### 1. Configure Netlify Environment Variables

Add these environment variables in your Netlify dashboard (Site settings → Environment variables):

```
B2_ACCESS_KEY_ID=<your_b2_application_key_id>
B2_SECRET_ACCESS_KEY=<your_b2_application_key>
B2_BUCKET=panelfrak-assets
B2_REGION=auto
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
```

### 2. Make Sure Your B2 Bucket is Public

1. Log into [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Go to your bucket `panelfrak-assets`
3. Set **Bucket Settings** → **Files in Bucket** to **Public**

### 3. Deploy to Netlify

```bash
git add .
git commit -m "Add B2 auto-upload integration"
git push
```

That's it! Once deployed, the CMS will automatically upload images to B2.

## How It Works

1. **User selects image** in Sveltia CMS
2. **File is sent** to `/.netlify/functions/s3` endpoint
3. **Serverless function** uploads to B2 using your credentials (secure, not exposed to browser)
4. **Relative path saved** in frontmatter: `/uploads/[timestamp]-[filename]`
5. **Hugo converts to full B2 URL** at build time using the `media-url.html` partial
6. **Final URL** on website: `https://f005.backblazeb2.com/file/panelfrak-assets/uploads/[filename]`

### Why This Approach?

- Sveltia CMS doesn't support absolute URLs in `public_folder`
- We save relative paths (`/uploads/...`) in content
- Hugo template automatically converts to full B2 CDN URLs
- Best of both worlds: clean content files + CDN delivery

## Files Created

- `netlify/functions/s3.ts` - Serverless function that handles secure S3/B2 uploads
- `admin/config.yml` - Updated to use relative paths for media
- `admin/index.html` - Enhanced with upload handler
- `themes/panelfrak/layouts/partials/media-url.html` - Converts relative paths to B2 CDN URLs
- `themes/panelfrak/layouts/index.html` - Updated to use media-url partial
- `hugo.yaml` - Added `cdnURL` parameter
- `package.json` - Added AWS SDK dependencies

## Get Your B2 Credentials

1. Log into [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Go to **App Keys** and create a new Application Key
3. Note down:
   - **Application Key ID** (this goes in `B2_ACCESS_KEY_ID`)
   - **Application Key** (this goes in `B2_SECRET_ACCESS_KEY`)
   - **S3 Endpoint**: Usually `https://s3.us-east-005.backblazeb2.com`

## Testing Locally

To test the upload function locally, create a `.env` file (don't commit this!):

```env
B2_ACCESS_KEY_ID=your_b2_application_key_id
B2_SECRET_ACCESS_KEY=your_b2_application_key
B2_BUCKET=panelfrak-assets
B2_REGION=auto
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
```

Then run: `netlify dev`

## Uploaded File Format

Files will be uploaded with timestamps to avoid conflicts:
```
uploads/1738021234567-my-image.jpg
```

Public URL:
```
https://f005.backblazeb2.com/file/panelfrak-assets/uploads/1738021234567-my-image.jpg
```

## Troubleshooting

### Upload Fails with "S3 credentials not configured"

- Check that environment variables are set in Netlify
- Redeploy the site after adding environment variables

### Upload Fails with "Access Denied"

1. Verify your B2 Application Key has **Read & Write** access to the bucket
2. Check bucket name matches exactly: `panelfrak-assets`
3. Ensure bucket is set to **Public**

### Images Don't Display on Website

1. Check bucket **Files in Bucket** setting is **Public**
2. Verify the URL starts with: `https://f005.backblazeb2.com/file/panelfrak-assets/`
3. Try accessing the URL directly in your browser

### CORS Errors

If you see CORS errors in the browser console, add CORS rules to your B2 bucket:

In B2 bucket settings → **Bucket CORS Rules**:
```json
[
  {
    "corsRuleName": "allowAll",
    "allowedOrigins": ["*"],
    "allowedHeaders": ["*"],
    "allowedOperations": ["s3_get", "s3_head", "s3_put"],
    "maxAgeSeconds": 3600
  }
]
```

## Security

✅ **Secure**: Credentials are stored in Netlify environment variables (server-side only)  
✅ **Safe**: The serverless function handles uploads, credentials never exposed to browser  
✅ **Private**: Never commit `.env` or credentials to git  

## Alternative: Manual Upload

If auto-upload doesn't work, you can still manually upload to B2:

1. Upload files to B2 via web interface
2. Get the public URL
3. Paste the URL in the CMS image field

The image field accepts direct URLs, so manual upload is always an option!
