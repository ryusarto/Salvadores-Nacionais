/** Semantic menu buttons: exact canvas hit areas on desktop, readable native menus on touch. */
export function createMenuAccess(canvas) {
  const root = document.createElement('section'); root.id = 'accessible-menu'; root.setAttribute('aria-label', 'Menu do jogo');
  const heading = document.createElement('h1'), summary = document.createElement('p'), list = document.createElement('nav');
  summary.setAttribute('aria-live', 'polite'); root.append(heading, summary, list); document.body.append(root);
  let signature = '';
  return function sync(title, description, items) {
    root.hidden = !items.length;
    if (!items.length) return;
    if (heading.textContent !== title) heading.textContent = title;
    if (summary.textContent !== description) summary.textContent = description;
    const r = canvas.getBoundingClientRect();
    root.style.setProperty('--canvas-left', `${r.left}px`); root.style.setProperty('--canvas-top', `${r.top}px`);
    root.style.setProperty('--canvas-width', `${r.width}px`); root.style.setProperty('--canvas-height', `${r.height}px`);
    const next = items.map(i => i.id).join('|');
    if (next !== signature) { list.replaceChildren(...items.map(() => document.createElement('button'))); signature = next; }
    [...list.children].forEach((button, index) => {
      const item = items[index]; button.type = 'button';
      if (button.dataset.label !== item.label || button.dataset.icon !== (item.icon || '')) {
        const text = document.createElement('span'); text.textContent = item.label;
        button.replaceChildren(text);
        if (item.icon) { const img = document.createElement('img'); img.alt = ''; img.src = item.icon; button.prepend(img); }
        button.dataset.label = item.label; button.dataset.icon = item.icon || '';
      }
      button.dataset.action = item.id; button.setAttribute('aria-pressed', String(!!item.selected));
      button.style.left = `${item.x / 19.2}%`; button.style.top = `${item.y / 10.8}%`;
      button.style.width = `${item.w / 19.2}%`; button.style.height = `${item.h / 10.8}%`;
      button.onclick = item.activate; button.onfocus = item.focus || null;
    });
  };
}
