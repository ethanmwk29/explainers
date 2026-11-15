// The catalog of every section and explainer on the site.
// To add an explainer: create <section-id>/<slug>/index.html, then add an
// entry to that section's `explainers` list below. The home page and the
// section pages are built from this list.
const CATALOG = [
  {
    id: 'distributed-systems',
    title: 'Distributed Systems',
    blurb: 'How independent machines share data, disagree, and still end up consistent.',
    explainers: [
      {
        slug: 'add-wins-set',
        title: 'The add-wins set',
        blurb: 'How a CRDT lets two offline replicas edit the same set and still agree, and why adds beat removes.',
      },
    ],
  },
  {
    id: 'data-structures-algorithms',
    title: 'Data Structures & Algorithms',
    blurb: 'The building blocks of efficient programs, and the ideas behind them.',
    explainers: [
      {
        slug: 'union-find',
        title: 'Union Find',
        blurb: 'Track which things are connected using a forest of parent pointers, two small tricks, and nearly constant time.',
      },
      {
        slug: 'tarjan-scc',
        title: "Tarjan's SCC algorithm",
        blurb: 'Split a directed graph into strongly connected components with a single depth-first search, step by step.',
      },
    ],
  },
];

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

// Home page: one card per section, listing its explainers.
function renderHome(container) {
  container.replaceChildren(...CATALOG.map(section =>
    el('li', { class: 'section-card' },
      el('div', { class: 'section-card-head' },
        el('h2', {}, el('a', { href: `${section.id}/` }, section.title)),
        el('span', { class: 'count' }, plural(section.explainers.length, 'explainer'))),
      el('p', {}, section.blurb),
      el('ul', { class: 'section-links' }, section.explainers.map(x =>
        el('li', {}, el('a', { href: `${section.id}/${x.slug}/` }, x.title, ' →')))))));
}

// Section page: a card per explainer in this section.
function renderSection(sectionId, container) {
  const section = CATALOG.find(s => s.id === sectionId);
  document.getElementById('section-title').textContent = section.title;
  document.getElementById('section-blurb').textContent = section.blurb;
  container.replaceChildren(...section.explainers.map(x =>
    el('li', {},
      el('a', { class: 'card', href: `${x.slug}/` },
        el('h2', {}, x.title),
        el('p', {}, x.blurb)))));
}
