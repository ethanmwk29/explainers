# Explainers

Small, interactive explainers, served with GitHub Pages at https://ethanmwk29.github.io/explainers/

- [The add-wins set](https://ethanmwk29.github.io/explainers/add-wins-set/): an interactive walkthrough of the OR-Set CRDT.

Each explainer lives in its own folder as plain HTML/CSS/JS, with no build step. Shared styles are in `style.css`.

## How the hosting works

[GitHub Pages](https://docs.github.com/en/pages) is a free feature that turns a repository into a website. Every repo can have one, and it's off until you turn it on in the repo's **Settings → Pages**. For this repo it's set to publish from the `main` branch, using the files at the root of the repo.

**What happens when we push.** Each push to `main` starts a short GitHub Actions job (it appears in the repo's **Actions** tab). The job copies the files to GitHub's web servers. About a minute later, the new version is live.

**How URLs map to files.** The site lives at `https://<username>.github.io/<repo-name>/`, and every path after that corresponds to a file in the repo:

| URL | File in this repo |
| --- | --- |
| `ethanmwk29.github.io/explainers/` | `index.html` |
| `ethanmwk29.github.io/explainers/add-wins-set/` | `add-wins-set/index.html` |
| `ethanmwk29.github.io/explainers/style.css` | `style.css` |

When a URL ends in a folder name, the server looks for an `index.html` file inside that folder. That's why each explainer gets its own folder with an `index.html` in it.

**What it can and can't do.** Pages serves *static* files, meaning HTML, CSS, JavaScript and images, exactly as they are stored in the repo. There's no server running our code, so no database, no logins and no server-side processing. Everything interactive, like the CRDT playground, runs as JavaScript in the visitor's browser, which is all an explainer needs.

**A few details:**
- The empty `.nojekyll` file tells GitHub to serve our files as-is. Without it, GitHub runs them through Jekyll, a site generator that ignores some files (such as anything starting with `_`).
- The repo is public, and so is the site. Anyone with the link can view it.
- To add an explainer: create a new folder with an `index.html`, add a card linking to it in the root `index.html`, then commit and push.
