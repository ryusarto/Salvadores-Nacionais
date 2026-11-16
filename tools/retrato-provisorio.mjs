// Gera retrato e ícone PROVISÓRIOS (silhueta) para um chefe que ainda não tem arte HQ,
// e registra os dois no manifesto da interface.
// Uso: node tools/retrato-provisorio.mjs <id> "<cor do terno>" "<cor do detalhe>" [chupeta|carimbo|mala]
// Quando o retrato de verdade chegar, substitua os dois arquivos e rode de novo o
// cálculo de sha256 (ou apague a entrada e gere outra vez).
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const [id, suit = '#2f5d9e', accent = '#ff8fc0', prop = ''] = process.argv.slice(2);
if (!id) throw new Error('informe o id do personagem');
const dir = 'production/ui/comic-v1';
const ink = '#17131b';

const pacifier = (x, y, s) => `
  <g transform="translate(${x} ${y}) scale(${s})" stroke="${ink}" stroke-width="10">
    <ellipse cx="60" cy="0" rx="46" ry="34" fill="#ffe9a8"/>
    <ellipse cx="0" cy="0" rx="34" ry="72" fill="${accent}"/>
    <path d="M -10 -40 A 44 44 0 0 0 -10 40" fill="none" stroke-width="16"/>
    <path d="M -10 -40 A 44 44 0 0 0 -10 40" fill="none" stroke="${accent}" stroke-width="6"/>
  </g>`;

const bag = (x, y, s) => `
  <g transform="translate(${x} ${y}) scale(${s})" stroke="${ink}" stroke-width="8">
    <path d="M -24 -60 L -24 -84 L 24 -84 L 24 -60" fill="none"/>
    <rect x="-80" y="-60" width="160" height="110" rx="12" fill="${accent}"/>
    <rect x="-80" y="-12" width="160" height="16" fill="#d8b25a"/>
  </g>`;

const stamp = (x, y, s) => `
  <g transform="translate(${x} ${y}) scale(${s})" stroke="${ink}" stroke-width="8">
    <rect x="-12" y="-80" width="24" height="56" fill="#6b4a2a"/>
    <rect x="-56" y="-30" width="112" height="50" rx="8" fill="#3a3036"/>
    <rect x="-52" y="18" width="104" height="16" fill="${accent}"/>
  </g>`;

const portrait = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="1024">
  <path d="M 70 1024 C 80 700 200 610 384 600 C 568 610 688 700 698 1024 Z" fill="${suit}" stroke="${ink}" stroke-width="14"/>
  <path d="M 330 610 L 384 760 L 438 610 Z" fill="#f4f0ea" stroke="${ink}" stroke-width="10"/>
  <ellipse cx="384" cy="400" rx="170" ry="205" fill="#4a4152" stroke="${ink}" stroke-width="14"/>
  ${prop === 'chupeta' ? pacifier(330, 520, 1.15) : ''}
  ${prop === 'carimbo' ? stamp(560, 760, 1.6) : ''}
  ${prop === 'mala' ? bag(560, 820, 1.5) : ''}
</svg>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
  <path d="M 20 256 C 26 190 70 168 128 165 C 186 168 230 190 236 256 Z" fill="${suit}" stroke="${ink}" stroke-width="8"/>
  <ellipse cx="128" cy="100" rx="62" ry="74" fill="#4a4152" stroke="${ink}" stroke-width="8"/>
  ${prop === 'chupeta' ? pacifier(104, 160, 0.42) : ''}
  ${prop === 'carimbo' ? stamp(196, 214, 0.6) : ''}
  ${prop === 'mala' ? bag(196, 220, 0.55) : ''}
</svg>`;

const manifest = JSON.parse(readFileSync(`${dir}/manifest.json`, 'utf8'));
for (const [kind, svg, w, h, folder] of [['portrait', portrait, 768, 1024, 'portraits'], ['icon', icon, 256, 256, 'icons']]) {
  const path = `${folder}/${id}.webp`;
  const bytes = await sharp(Buffer.from(svg)).resize(w, h).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  writeFileSync(`${dir}/${path}`, bytes);
  manifest.assets[`${kind}-${id}`] = { path, width: w, height: h, alpha: true, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, provisional: true };
}
if (!manifest.characters.includes(id)) manifest.characters.push(id);
writeFileSync(`${dir}/manifest.json`, JSON.stringify(manifest, null, 2) + '\n');
console.log(`retrato e ícone provisórios de ${id} gerados`);
