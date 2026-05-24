# werkbudget-site

Public marketing + privacy site for [werkBudget](https://werkbudget.werkey.tech).

Plain HTML/CSS/JS. No build step. Hosted on GitHub Pages at the `werkbudget.werkey.tech` subdomain.

## Pages

- `index.html` — landing page (hero, envelopes, scroll-scrubbed paycheck flow, features, privacy callout, TestFlight CTA)
- `about.html` — why werkBudget exists
- `privacy.html` — TestFlight-ready privacy policy

## Local preview

Just open `index.html` in a browser, or run any static server, e.g.:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deployment

### 1. Push to GitHub

```bash
cd ~/Documents/werkbudget-site
git init
git add .
git commit -m "Initial site"
git branch -M main
gh repo create werkbudget-site --public --source=. --remote=origin --push
```

(Or create the repo in the GitHub UI and `git remote add origin` / `git push -u origin main` manually.)

### 2. Enable GitHub Pages

In the repo on github.com:

1. **Settings → Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main`, folder `/ (root)`
4. **Save**

GitHub will read the included `CNAME` file (`werkbudget.werkey.tech`) and configure the custom domain automatically. First build takes ~1–2 minutes.

### 3. Squarespace DNS

In Squarespace Domains → `werkey.tech` → DNS Settings → **Custom Records**, add:

| Host         | Type   | Data                                |
|--------------|--------|-------------------------------------|
| `werkbudget` | CNAME  | `<your-github-username>.github.io.` |

That's it — one record. The trailing dot is optional; Squarespace normalizes.

**Notes:**
- Replace `<your-github-username>` with your actual GitHub username (the CNAME points at the *account* `github.io` host, not the repo).
- Do **not** also add an A record for `werkbudget`. CNAME alone.
- Propagation is usually a few minutes, occasionally up to an hour.

### 4. Enforce HTTPS

Back in GitHub Pages settings, once DNS resolves:

1. Wait for the "DNS check successful" green check next to the custom domain.
2. Check **Enforce HTTPS**. GitHub provisions a Let's Encrypt cert; may take ~15 minutes after DNS verifies.

### 5. Verify

- Visit `https://werkbudget.werkey.tech` — should serve the landing page.
- Visit `https://werkbudget.werkey.tech/privacy.html` — this is the URL to paste into App Store Connect → App Information → **Privacy Policy URL**.

## Updating content

Edit the relevant `.html` file, commit, push. GitHub Pages rebuilds automatically (~30 seconds).

## Notes

- The CNAME file at repo root is what tells GitHub Pages the custom domain. Don't delete it.
- Privacy policy "Last updated" date is in the page; update it whenever the policy changes materially.
- Tokens in `styles.css` mirror the app's `AppColor` palette (Spruce accent on warm off-white, dark-mode tuned independently). If you change the app's accent later, update both.
