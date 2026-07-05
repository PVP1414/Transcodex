# Deployment Guide

This project is split into a Vite frontend and an Express backend.

## MongoDB Atlas

1. Create a free Atlas cluster.
2. Create a database user.
3. Add network access for Render. On the free tier, use `0.0.0.0/0` unless you later move to a service with fixed outbound IPs.
4. Copy the connection string and include a database name, for example:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

## GitHub Media Storage

Create a separate private repository for uploaded media, then create a fine-grained personal access token scoped only to that repository with `Contents: Read and write`.

Backend storage variables:

```env
STORAGE_TYPE=github
GITHUB_TOKEN=<fine-grained-token>
GITHUB_OWNER=<github-user-or-org>
GITHUB_REPO=<media-storage-repo>
GITHUB_BRANCH=main
GITHUB_BASE_PATH=uploads
GITHUB_COMMITTER_NAME=Media Storage Bot
GITHUB_COMMITTER_EMAIL=media-storage@example.com
```

## Render Backend

Create a Render Web Service from this repo.

- Root directory: `backend`
- Runtime: Node
- Instance type: Free
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

Environment variables:

```env
NODE_ENV=production
MONGODB_URI=<mongodb-atlas-uri>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
API_BASE_URL=https://<render-service>.onrender.com
STORAGE_TYPE=github
GITHUB_TOKEN=<fine-grained-token>
GITHUB_OWNER=<github-user-or-org>
GITHUB_REPO=<media-storage-repo>
GITHUB_BRANCH=main
GITHUB_BASE_PATH=uploads
```

Render free services spin down after idle periods and lose local filesystem changes on restart. Media files are therefore stored through GitHub, while local files are only temporary processing files.

## Vercel Frontend

Create a Vercel project from this repo.

- Root directory: `frontend`
- Framework preset: Vite
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

Environment variable:

```env
VITE_API_URL=https://<render-service>.onrender.com/api
```

## Verification

1. Open `https://<render-service>.onrender.com/api/health` and confirm it returns `{"status":"ok"}`.
2. Open the Vercel deployment URL.
3. Register or log in.
4. Upload a small image and confirm the original plus generated derivatives appear in the GitHub media repo.
5. Upload a small video and confirm HLS processing completes and playback works after a Render redeploy or restart.
6. Refresh a nested frontend route such as `/login` or `/gallery` to confirm Vercel rewrites work.
