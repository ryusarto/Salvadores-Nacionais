# Belga — sprites de 500px

Belga usa o rosto, o porte e a roupa das referências fotográficas fornecidas:
rosto arredondado, bigode discreto, boné com faixa escura, tatuagens no pescoço
e nos braços, colete bege, camiseta branca larga e calça marrom estampada.

O kit inclui **40 animações do lutador e 8 animações de efeitos**, com **288
frames**. Cada imagem contém uma única animação com seis frames de **500×500px**,
alpha real e proporções calibradas. As poses agachadas mantêm a anatomia e ficam
naturalmente mais baixas.

- `production/sprites/source/belga-v2/pranchas/`: 48 PNGs de 1500×1000, grade 3×2.
- `production/sprites/source/belga-v2/tiras/`: mestres PNG de 3000×500.
- `production/sprites/final/belga/`: as 40 tiras WebP usadas pelo lutador.
- `production/sprites/final/belga-fx/`: as oito tiras WebP dos efeitos.
- `production/qa/belga-sprites.html`: prévia com player de 500px, espelhamento,
  avanço quadro a quadro, fundos para conferir alpha e download do frame PNG.

Execute `npm ci`, `npm test` e `npm run build`. Sirva a raiz com
`python3 -m http.server 8000` e abra
`http://localhost:8000/dist/salvadores-nacionais.html` para jogar ou
`http://localhost:8000/production/qa/belga-sprites.html` para revisar a arte.

`node tools/build-belga-preview.mjs production/qa/belga-previa-500px.html`
cria a prévia independente que abre diretamente no navegador, sem servidor.

As regras de luta permanecem as mesmas. A arte acompanha os dois contatos do
Um-Dois, os três vinis do Disco Duplo, os sete do Vinil Fatal, o Pêndulo e a
recuperação dos normais modificada pelo BPM. Cada movimento tem sua própria
tira, sem os aliases antigos que reutilizavam o super.

O desenvolvimento está no fork
https://github.com/francothesir/Salvadores-Nacionais. Trunks também está
integrado na mesma versão do jogo.
