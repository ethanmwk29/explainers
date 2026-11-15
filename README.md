# Explainers

Small, interactive explainers, served with GitHub Pages at https://ethanmwk29.github.io/explainers/

**Distributed Systems**
- [The add-wins set](https://ethanmwk29.github.io/explainers/distributed-systems/add-wins-set/): an interactive walkthrough of the OR-Set CRDT.
- [Scuttlebutt gossip](https://ethanmwk29.github.io/explainers/distributed-systems/scuttlebutt/): efficient reconciliation and flow control for anti-entropy gossip.

**Data Structures & Algorithms**
- [Union Find](https://ethanmwk29.github.io/explainers/data-structures-algorithms/union-find/): parent pointers, union by size, and path compression.
- [Tarjan's SCC algorithm](https://ethanmwk29.github.io/explainers/data-structures-algorithms/tarjan-scc/): a step-by-step visualizer for finding strongly connected components.
- [Strong bridges and dominators](https://ethanmwk29.github.io/explainers/data-structures-algorithms/strong-bridges/): the edges that hold a strongly connected graph together.
- [Which edges can you remove?](https://ethanmwk29.github.io/explainers/data-structures-algorithms/bridges/): bridges, spanning trees, and one-at-a-time vs. all-at-once removal.
- [Minimum spanning trees](https://ethanmwk29.github.io/explainers/data-structures-algorithms/mst/): the cut property, Kruskal and Prim.

Code examples on the explainer pages are written in Go.

## Layout

```
index.html                      home page: lists every section
catalog.json                    the list of sections + explainers (home and section pages are built from it)
site.js                         renders the home and section pages from catalog.json
style.css                       shared styles, including light and dark color tokens
theme.js                        theme toggle (Auto / Light / Dark) loaded in every page's <head>
<section>/index.html            a section page, e.g. distributed-systems/
<section>/<explainer>/index.html  one explainer, e.g. distributed-systems/add-wins-set/
```

Each explainer is plain HTML/CSS/JS with no build step. To add one, create its folder and `index.html`, then add an entry to that section in `catalog.json`. To add a section, add it to `catalog.json` and copy one of the existing section pages, changing the section id.

`drake/` is a photo-only section: its catalog entry has an `image` instead of explainers.

`add-wins-set/` at the root is a redirect left in place so the old link keeps working.

## How the hosting works

[GitHub Pages](https://docs.github.com/en/pages) is a free feature that turns a repository into a website. Every repo can have one, and it's off until you turn it on in the repo's **Settings → Pages**. For this repo it's set to publish from the `main` branch, using the files at the root of the repo.

**What happens when we push.** Each push to `main` starts a short GitHub Actions job (it appears in the repo's **Actions** tab). The job copies the files to GitHub's web servers. About a minute later, the new version is live.

**How URLs map to files.** The site lives at `https://<username>.github.io/<repo-name>/`, and every path after that corresponds to a file in the repo:

| URL | File in this repo |
| --- | --- |
| `ethanmwk29.github.io/explainers/` | `index.html` |
| `ethanmwk29.github.io/explainers/distributed-systems/` | `distributed-systems/index.html` |
| `ethanmwk29.github.io/explainers/distributed-systems/add-wins-set/` | `distributed-systems/add-wins-set/index.html` |
| `ethanmwk29.github.io/explainers/style.css` | `style.css` |

When a URL ends in a folder name, the server looks for an `index.html` file inside that folder. That's why each explainer gets its own folder with an `index.html` in it.

**What it can and can't do.** Pages serves *static* files, meaning HTML, CSS, JavaScript and images, exactly as they are stored in the repo. There's no server running our code, so no database, no logins and no server-side processing. Everything interactive, like the CRDT playground, runs as JavaScript in the visitor's browser, which is all an explainer needs.

**A few details:**
- The empty `.nojekyll` file tells GitHub to serve our files as-is. Without it, GitHub runs them through Jekyll, a site generator that ignores some files (such as anything starting with `_`).
- The repo is public, and so is the site. Anyone with the link can view it.
- To add an explainer, follow the steps under **Layout** above, then commit and push.
