// Theme toggle shared by every page: Auto (follow the OS) → Light → Dark.
//
// Load this in <head> (not deferred) so the saved theme is applied before the
// page paints. It sets data-theme="light" or "dark" on <html>; with no
// attribute, style.css follows the OS setting. Pages that pick colors in
// JavaScript can call Theme.isDark() and Theme.onChange(fn).
(function () {
  const KEY = 'explainers-theme';
  const MODES = ['auto', 'light', 'dark'];
  const LABELS = { auto: '◐ Auto', light: '☀ Light', dark: '☾ Dark' };
  const media = matchMedia('(prefers-color-scheme: dark)');
  const listeners = [];

  function read() {
    try { const v = localStorage.getItem(KEY); return MODES.includes(v) ? v : 'auto'; } catch { return 'auto'; }
  }
  function write(mode) {
    try { localStorage.setItem(KEY, mode); } catch { /* private mode etc.: still works for this page view */ }
  }

  let mode = read();
  function apply() {
    const root = document.documentElement;
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
  }
  apply();

  const isDark = () => (mode === 'auto' ? media.matches : mode === 'dark');
  const notify = () => listeners.forEach(fn => { try { fn(isDark()); } catch (e) { console.error(e); } });
  media.addEventListener('change', () => { if (mode === 'auto') notify(); });

  function addButton() {
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    const label = () => {
      btn.textContent = LABELS[mode];
      btn.setAttribute('aria-label', `Theme: ${mode}. Click to change.`);
      btn.title = 'Switch between automatic, light and dark themes';
    };
    label();
    btn.addEventListener('click', () => {
      mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      write(mode);
      apply();
      label();
      notify();
    });
    document.body.append(btn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addButton);
  else addButton();

  window.Theme = { isDark, onChange: fn => listeners.push(fn) };
})();
