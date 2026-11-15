// Builds the home page and section pages from catalog.json.
//
// To add an explainer: create <section-id>/<slug>/index.html, then add an
// entry to that section's "explainers" list in catalog.json.
//
// The catalog is fetched with cache: 'no-cache', so the browser checks for a
// newer version on every visit instead of reusing a stale copy for up to
// 10 minutes (GitHub Pages' default). Unchanged files aren't re-downloaded.

function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  for (const k of kids.flat(Infinity)) {
    if (k == null) continue;
    node.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return node;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

async function loadCatalog(root) {
  const res = await fetch(`${root}catalog.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`catalog.json: HTTP ${res.status}`);
  return res.json();
}

function showError(container, err) {
  console.error(err);
  container.replaceChildren(el('li', { class: 'none' }, 'Couldn’t load the list of explainers. Try refreshing the page.'));
}

// Home page: one card per section, listing its explainers.
async function renderHome(container) {
  try {
    const catalog = await loadCatalog('');
    container.replaceChildren(...catalog.map(section => section.image
      // A section that's just a photo: show it, linked to its page.
      ? el('li', { class: 'section-card' },
          el('div', { class: 'section-card-head' },
            el('h2', {}, el('a', { href: `${section.id}/` }, section.title))),
          el('a', { href: `${section.id}/` },
            el('img', { class: 'section-photo', src: section.image, alt: section.imageAlt || '', width: '208', height: '208', loading: 'lazy' })))
      : el('li', { class: 'section-card' },
        el('div', { class: 'section-card-head' },
          el('h2', {}, el('a', { href: `${section.id}/` }, section.title)),
          el('span', { class: 'count' }, plural(section.explainers.length, 'explainer'))),
        el('p', {}, section.blurb),
        el('ul', { class: 'section-links' }, section.explainers.map(x =>
          el('li', {}, el('a', { href: `${section.id}/${x.slug}/` }, x.title, ' →')))))));
  } catch (err) { showError(container, err); }
}

// Section page: a card per explainer in this section.
async function renderSection(sectionId, container) {
  try {
    const catalog = await loadCatalog('../');
    const section = catalog.find(s => s.id === sectionId);
    document.getElementById('section-title').textContent = section.title;
    document.getElementById('section-blurb').textContent = section.blurb;
    container.replaceChildren(...section.explainers.map(x =>
      el('li', {},
        el('a', { class: 'card', href: `${x.slug}/` },
          el('h2', {}, x.title),
          el('p', {}, x.blurb)))));
  } catch (err) { showError(container, err); }
}
