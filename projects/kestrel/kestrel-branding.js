/* Presentation-only name override for the vendored Jaeger UI (Apache-2.0).
 * Upstream logo, assets, navigation, functionality and attribution are unchanged.
 */
(function () {
  function applyName() {
    for (const name of document.querySelectorAll('.Branding--name')) {
      if (name.textContent === 'Jaeger') name.textContent = 'Kestrel';
    }
    const title = document.title.replace(/\bJaeger(?: UI)?\b/g, 'Kestrel');
    if (title !== document.title) document.title = title;
  }
  const root = document.getElementById('jaeger-ui-root');
  const observer = new MutationObserver(applyName);
  if (root) observer.observe(root, { childList: true, subtree: true, characterData: true });
  const title = document.querySelector('title');
  if (title) observer.observe(title, { childList: true, subtree: true, characterData: true });
  applyName();
})();
