# Conceiving Victory — Standalone HTML Site

A self-contained HTML/CSS/JavaScript site on **Vercel**, with content pulled from GitHub.
The practice owner can edit page text in a form UI at `/admin` (no coding required).

## Owner: how to edit site text

1. Open `https://YOUR_DOMAIN/admin`
2. Click **Login with GitHub** (use the GitHub account that has access to this repo)
3. Edit the labeled fields (vow, fees, reviews, etc.)
4. Click **Save** / **Publish**
5. Wait about a minute for Vercel to redeploy, then refresh the public site

To revoke editing access later: remove that person as a GitHub collaborator on the repository.

## Security (short version)

- `/admin` is a public URL, but **saving requires GitHub login with write access** to this repo
- OAuth secrets live only in **Vercel environment variables**, never in the public site files
- Visitors can read the same words the site shows; they cannot change them without GitHub permission

## One-time developer setup

### 1. Point the CMS at your GitHub repo

Edit [`admin/settings.json`](admin/settings.json):

```json
{
  "backend": {
    "name": "github",
    "repo": "your-github-user/your-repo-name",
    "branch": "main"
  }
}
```

Add the practice owner as a **collaborator** (Write access) on that GitHub repo.

### 2. Create a GitHub OAuth App

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App**
2. **Homepage URL:** `https://YOUR_DOMAIN`
3. **Authorization callback URL:** `https://YOUR_DOMAIN/api/callback`
4. Register and copy the **Client ID** and **Client Secret**

### 3. Add secrets on Vercel

In the Vercel project → **Settings** → **Environment Variables**:

| Name | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | from the OAuth App |
| `GITHUB_CLIENT_SECRET` | from the OAuth App |

Redeploy after saving env vars.

A template is in [`.env.example`](.env.example) (do not commit real secrets).

### 4. Confirm deploy

- Public site: `https://YOUR_DOMAIN/`
- Editor: `https://YOUR_DOMAIN/admin`

## Files

```
conceiving-victory/
├── index.html              ← Page structure (fallback copy in HTML)
├── styles.css              ← Styling
├── script.js               ← Loads content/site.json into the page
├── content/
│   └── site.json           ← All editable text (what /admin edits)
├── admin/
│   ├── index.html          ← Decap CMS UI
│   ├── config.yml          ← Form field labels
│   └── settings.json       ← GitHub repo name (set this!)
├── api/
│   ├── auth.js             ← Start GitHub login
│   └── callback.js         ← Finish GitHub login
├── privacy.html / terms.html / support.html
├── 404.html
├── vercel.json
└── assets/
```

## Local preview (public site)

```bash
python -m http.server 8000
# open http://localhost:8000
```

The public site reads `content/site.json` in the browser.  
GitHub login for `/admin` needs the deployed Vercel OAuth callback (or a local OAuth proxy). Editing content locally without login: change `content/site.json` directly, then refresh.

## What’s inside

- Sticky practice index + prose layout
- Fee schedule, reviews, workshop topics driven by JSON
- Email-to-inquire links using the address in `content/site.json`
- Privacy / Terms / Support pages
- SEO: canonical URLs, Open Graph / Twitter cards, JSON-LD, `robots.txt`, `sitemap.xml`

## SEO notes

- Public pages are indexable; `/admin` and `/api` are blocked in `robots.txt` and send `noindex`
- After deploy, submit `https://YOUR_DOMAIN/sitemap.xml` in [Google Search Console](https://search.google.com/search-console)
- Title, description, and social share fields are editable in `/admin` under **Site settings & SEO**
