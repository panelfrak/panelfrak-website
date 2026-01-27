# B2 Auto-Upload - Quick Reference

## ✅ What's Done

- ✅ Serverless S3 upload function created: `netlify/functions/s3.ts`
- ✅ CMS configured for B2 integration
- ✅ Upload handler added to CMS interface
- ✅ AWS SDK dependencies installed
- ✅ Hardcoded credentials removed (secure!)

## 🚀 Next Steps

### 1. Add Environment Variables to Netlify

Go to: **Netlify Dashboard → Site Settings → Environment Variables**

Add these 5 variables:
```
B2_ACCESS_KEY_ID = <from B2 App Keys>
B2_SECRET_ACCESS_KEY = <from B2 App Keys>
B2_BUCKET = panelfrak-assets
B2_REGION = auto
B2_ENDPOINT = https://s3.us-east-005.backblazeb2.com
```

### 2. Make Your B2 Bucket Public

In Backblaze B2 dashboard:
- Go to bucket `panelfrak-assets`
- **Bucket Settings** → Set **Files in Bucket** to **Public**

### 3. Deploy

```bash
git add .
git commit -m "Add B2 auto-upload integration"
git push
```

## 📸 How to Upload Images

1. Open Sveltia CMS: `https://your-site.netlify.app/admin/`
2. Edit any content with an image field
3. Click the image widget
4. Select a file from your computer
5. File uploads automatically to B2!
6. Relative path is saved: `/uploads/[timestamp]-[filename]`
7. Hugo converts to full B2 URL at build time

## 🔍 Where to Get B2 Credentials

**Backblaze B2 Dashboard:**
1. Login → **App Keys**
2. Click **Add New Application Key**
3. Give it a name (e.g., "Netlify CMS")
4. Select bucket: `panelfrak-assets`
5. Permissions: **Read & Write**
6. Copy:
   - **keyID** → `B2_ACCESS_KEY_ID`
   - **applicationKey** → `B2_SECRET_ACCESS_KEY`

## 📁 Upload Location

Files upload to: `panelfrak-assets/uploads/[timestamp]-[filename]`

Example: `uploads/1738021234567-comic-cover.jpg`

Public URL: `https://f005.backblazeb2.com/file/panelfrak-assets/uploads/1738021234567-comic-cover.jpg`

## 🐛 Troubleshooting

**"S3 credentials not configured"**
→ Add environment variables in Netlify and redeploy

**"Access Denied"**
→ Check B2 App Key has Read & Write access

**Images don't show on site**
→ Make sure bucket is Public in B2 settings

**CORS errors**
→ Add CORS rules to B2 bucket (see B2_SETUP.md)

## 📚 Full Documentation

See [admin/B2_SETUP.md](B2_SETUP.md) for detailed instructions and troubleshooting.
