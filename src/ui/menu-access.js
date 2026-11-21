import { createMobileMenu, menuRole } from './mobile-menu.js';

/** Shared actions: canvas hit areas on PC, responsive cartridge-style menus on touch. */
export function createMenuAccess(canvas) {
  const root = document.createElement('section'); root.id = 'accessible-menu'; root.setAttribute('aria-label', 'Menu do jogo');
  const heading = document.createElement('h1'), summary = document.createElement('p'), list = document.createElement('nav');
  const actions = document.createElement('nav'); actions.className = 'mobile-menu-actions'; actions.setAttribute('aria-label', 'Navegação do menu');
  list.setAttribute('aria-label', 'Escolhas');
  summary.setAttribute('aria-live', 'polite'); document.body.append(root);
  const mobile = createMobileMenu(root, heading, summary, list, actions);
  let signature = '';
  const buttons = new Map();
  return function sync(title, description, items, meta = {}) {
    root.hidden = !items.length;
    const open = String(!!items.length);
    if (document.body.dataset.menuOpen !== open) document.body.dataset.menuOpen = open;
    if (!items.length) return;
    if (heading.textContent !== title) heading.textContent = title;
    if (summary.textContent !== description) summary.textContent = description;
    const touch = document.documentElement.classList.contains('touch');
    if (!touch) {
      const r = canvas.getBoundingClientRect();
      root.style.setProperty('--canvas-left', `${r.left}px`); root.style.setProperty('--canvas-top', `${r.top}px`);
      root.style.setProperty('--canvas-width', `${r.width}px`); root.style.setProperty('--canvas-height', `${r.height}px`);
    }
    const next = items.map(i => i.id).join('|');
    if (next !== signature) {
      list.replaceChildren(); actions.replaceChildren(); buttons.clear();
      for (const item of items) {
        const button = document.createElement('button'); button.type = 'button';
        button.dataset.role = menuRole(item.id); buttons.set(item.id, button);
        (['back', 'primary'].includes(menuRole(item.id)) ? actions : list).append(button);
      }
      signature = next;
    }
    items.forEach(item => {
      const button = buttons.get(item.id);
      if (button.dataset.label !== item.label || button.dataset.icon !== (item.icon || '')) {
        const text = document.createElement('span'); text.className = 'menu-button-text'; text.textContent = item.label;
        button.replaceChildren(text);
        if (item.icon) { const img = document.createElement('img'); img.alt = ''; img.src = item.icon; button.prepend(img); }
        const label = document.createElement('canvas'); label.className = 'mobile-button-label'; label.setAttribute('aria-hidden', 'true'); button.append(label);
        button.dataset.label = item.label; button.dataset.icon = item.icon || '';
      }
      button.dataset.action = item.id; button.setAttribute('aria-pressed', String(!!item.selected));
      button.disabled = !!item.disabled;
      button.setAttribute('aria-busy', String(!!item.busy));
      button.style.left = `${item.x / 19.2}%`; button.style.top = `${item.y / 10.8}%`;
      button.style.width = `${item.w / 19.2}%`; button.style.height = `${item.h / 10.8}%`;
      button.onclick = item.activate; button.onfocus = item.focus || null;
    });
    actions.hidden = !actions.children.length;
    mobile(meta, title, items);
    return touch;
  };
}
