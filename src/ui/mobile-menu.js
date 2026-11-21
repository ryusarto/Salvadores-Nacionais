import { ptext, ptextWidth, pwrap, pixelPortrait, goldLogo, drawWorldMap } from '../render/retro-ui.js';

// The touch menu uses the same pixel lettering, portraits and logo as the PC.
// Canvases are decorative: the native headings/buttons remain the accessible UI.
export function pixelLabel(canvas, label, style = 'cream', maxWidth = 260) {
  const key = `${label}|${style}|${maxWidth}`;
  if (canvas.dataset.paint === key) return;
  const lines = pwrap(label, maxWidth - 12, 2);
  canvas.width = Math.min(maxWidth, Math.max(24, ...lines.map(line => ptextWidth(line, 2) + 12)));
  canvas.height = Math.max(28, lines.length * 24 + 4);
  const c = canvas.getContext('2d');
  lines.forEach((line, i) => ptext(c, line, canvas.width / 2, 14 + i * 24, 2, style, 'center', maxWidth - 12));
  canvas.dataset.paint = key;
}

export function menuRole(id) {
  if (id.startsWith('pick-')) return 'fighter';
  if (['back', 'previous'].includes(id)) return 'back';
  if (['confirm-selection', 'next', 'fight'].includes(id)) return 'primary';
  return 'option';
}

export function createMobileMenu(root, heading, summary, list, actions) {
  const header = document.createElement('header'); header.className = 'mobile-menu-header';
  const logo = document.createElement('canvas'); logo.className = 'mobile-menu-logo'; logo.setAttribute('aria-hidden', 'true');
  const title = document.createElement('canvas'); title.className = 'mobile-menu-title'; title.setAttribute('aria-hidden', 'true');
  const hint = document.createElement('p'); hint.className = 'mobile-menu-hint';
  const body = document.createElement('div'); body.className = 'mobile-menu-body';
  const art = document.createElement('aside'); art.className = 'mobile-menu-art'; art.setAttribute('aria-hidden', 'true');
  const portrait = document.createElement('canvas'); portrait.width = 220; portrait.height = 220; art.append(portrait);
  const content = document.createElement('div'); content.className = 'mobile-menu-content';
  const details = document.createElement('dl'); details.className = 'mobile-menu-details';
  header.append(logo, heading, title, hint); content.append(summary, list, details); body.append(art, content);
  root.replaceChildren(header, body, actions);
  let screenKey = '', detailKey = '', artKey = '', logoReady = false;
  return function sync(meta, titleText, items) {
    const { screen = '', sub = '', preview, opponent, chapter } = meta;
    const key = `${screen}:${sub}`;
    if (key !== screenKey) { body.scrollTop = 0; artKey = ''; screenKey = key; }
    root.dataset.screen = screen; root.dataset.sub = sub || '';
    root.dataset.layout = screen === 'title' ? 'title' : ['select', 'selectFoe'].includes(screen) ? 'select' : screen === 'vs' ? 'versus' : screen.startsWith('story') ? 'story' : 'list';
    const touch = document.documentElement.classList.contains('touch');
    if (!touch) return;
    pixelLabel(title, titleText, 'gold', screen === 'title' ? 340 : 600);
    const titleWidth = `${title.width * 1.5}px`;
    if (title.style.width !== titleWidth) title.style.width = titleWidth;
    if (!logoReady && screen === 'title') {
      const image = goldLogo();
      if (image) { logo.width = image.width; logo.height = image.height; logo.getContext('2d').drawImage(image, 0, 0); logoReady = true; }
    }
    logo.hidden = screen !== 'title' || !logoReady;
    title.hidden = screen === 'title' && logoReady;
    const portraitFight = screen === 'fight' && innerHeight > innerWidth;
    hint.textContent = portraitFight ? 'Vire o celular de lado para retomar a luta.' : screen === 'title' ? 'TOQUE PARA ESCOLHER' : '';
    hint.hidden = !hint.textContent;
    const showMap = screen === 'storyMap';
    art.hidden = !preview && !showMap;
    const nextArt = `${screen}|${preview?.id}|${opponent?.id}|${chapter ?? ''}`;
    if (!art.hidden && artKey !== nextArt) {
      const c = portrait.getContext('2d'); c.clearRect(0, 0, portrait.width, portrait.height);
      if (showMap) {
        drawWorldMap(c, 10, 55, 200, 2);
        ptext(c, `CAPÍTULO ${(chapter ?? 0) + 1}`, 110, 180, 2, 'gold'); artKey = nextArt;
      } else if (preview) {
        if (opponent) {
          const a = pixelPortrait(c, preview.id, 0, 25, 105, 180);
          const b = pixelPortrait(c, opponent.id, 115, 25, 105, 180, true);
          ptext(c, 'VS', 110, 110, 3, 'gold'); if (a && b) artKey = nextArt;
        } else if (pixelPortrait(c, preview.id, 0, 0, 220, 220)) artKey = nextArt;
      }
    }
    const rows = meta.details || [], nextDetails = JSON.stringify(rows);
    if (detailKey !== nextDetails) {
      details.replaceChildren(...rows.flatMap(row => {
        const term = document.createElement('dt'), text = document.createElement('dd');
        term.textContent = row.label; text.textContent = row.value; return [term, text];
      })); detailKey = nextDetails;
    }
    details.hidden = !rows.length;
    for (const button of root.querySelectorAll('button[data-action]')) {
      const item = items.find(item => item.id === button.dataset.action);
      pixelLabel(button.querySelector('.mobile-button-label'), item.label, item.selected ? 'gold' : 'cream', item.id.startsWith('pick-') ? 96 : 260);
    }
  };
}
