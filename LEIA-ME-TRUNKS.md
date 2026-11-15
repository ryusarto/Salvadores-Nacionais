# Aplicar o kit do Trunks

Este pacote contém os sprites completos e a integração no jogo
`ryusarto/Salvadores-Nacionais`, com base no commit
`e8dc31e06856268d826e775c5cce7a66a38d279c` da branch `main`.

1. Faça uma cópia do seu projeto ou use uma branch nova.
2. Extraia as pastas deste ZIP sobre a raiz da cópia do jogo. O pacote contém
   somente arquivos adicionados ou alterados para o Trunks; a cópia existente
   fornece os demais personagens e arquivos do projeto.
3. Rode `npm ci`, `npm test` e `npm run build`.
4. Rode `python3 -m http.server 8000` na raiz e abra
   `http://localhost:8000/dist/salvadores-nacionais.html` para jogar.
5. Para inspecionar cada animação, abra
   `http://localhost:8000/production/qa/trunks-sprites.html`.

Se o seu projeto já tiver outras alterações nos mesmos arquivos de código,
compare antes de substituir. As mudanças estão concentradas na ficha do
Trunks, no carregamento de alpha, no desenho dos efeitos e nos novos módulos
`src/data/trunks-art.js` e `src/render/trunks-art.js`.

O arquivo independente `trunks-previa-500px.html`, entregue separadamente, abre
diretamente no navegador e mostra todas as 48 tiras com controles de revisão.

Inventário: **40 animações + 8 camadas, 288 frames transparentes**.
Cada imagem contém uma única animação com seis frames de 500×500.
As fontes têm células nativas de 512px e são reduzidas, sem ampliação.
As pranchas PNG têm 1500×1000 e as tiras PNG/WebP têm 3000×500. Veja todos os detalhes
em `production/sprites/source/trunks-v3/README.md`.

O desenvolvimento continua no fork https://github.com/francothesir/Salvadores-Nacionais,
com as melhorias do projeto original preservadas.
