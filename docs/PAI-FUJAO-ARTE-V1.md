# Pai do Fujão — arte integrada, seis quadros

O chefe do capítulo 5 passa a usar os desenhos aprovados: 40 animações de corpo (240 quadros), 20 sequências independentes de efeitos/capanga (120 quadros), retrato e ícone. As tiras são 3000 × 500, RGBA com transparência real, convertidas para WebP sem perda. A célula é 500 × 500 e o apoio fica em (250, 456).

As regras de combate continuam em `src/data/characters/pai-fujao.js` e `src/core/`. A alteração nesse personagem adiciona somente o perfil visual. Choque, foro, fúria, chamadas, capangas, dinheiro, dano e tempos não foram reequilibrados.

- Golpes comuns: antecipação nos índices 0/1, contato em 2/3, recuperação em 4/5.
- Comando à Distância: chamada no quadro real 16; o capanga inicia a antecipação antes de alcançar o alvo e mostra contato antes da remoção por colisão.
- Rachadinha: as cinco emissões reais alternam as poses 2/3. Dinheiro, impacto e cura usam camadas próprias.
- Prisão Domiciliar: os três contatos em 13–16, 30–32 e 48–51 usam respectivamente os índices 2, 3 e 4. A trava segue o alvo, sem deslocar sua colisão.
- Choque da tornozeleira: reação de 36 quadros, seguida pela tontura comum. A fúria aguarda uma pose livre para apresentar sua reação e reinicia com o recurso de uma nova rodada.
- Zona e indicador da tornozeleira: verde/ciano no interior, âmbar perto da borda, vermelho fora; não alternam condições apenas pelo tempo.
- Escudo e aura ficam atrás do corpo para preservar a leitura do rosto. O manequim de tornozeleira antigo não é acrescentado ao corpo desenhado.
- O pacote de efeitos admite dez tiras decodificadas para acomodar as cinco camadas permanentes e os transientes sem recarregamento a cada quadro.

Os PNGs corrigidos, manifestos e prompts ficam em `production/sprites/source/pai-fujao-v1/`; as tiras consumidas pelo jogo ficam em `production/sprites/final/pai-fujao{,-fx}/`. As fontes nativas completas, incluindo grupos de três poses e correções anteriores, permanecem no Dropbox, em `T&H/Assets/Salvadores Nacionais/pai-fujao-v1-6quadros`.

Reproduzir a importação e a prévia:

```sh
node tools/import-pai-fujao.mjs
node tools/pai-fujao-preview.mjs
npm test
npm run build
node tools/smoke-pai-fujao.mjs
```

A prévia está em `production/qa/pai-fujao-v1.html`. O smoke usa Chrome no macOS ou Chromium no Linux; `CHROMIUM_PATH` permite escolher outro executável. As capturas e o relatório são gravados em `artifacts/pai-fujao/`.

Validação executada: 226 testes unitários aprovados; revisão independente dos seletores e do cache; build; 18 cenas no Chrome nos dois sentidos, desktop e tela móvel; 60 tiras efetivamente decodificadas, sem erros HTTP/JavaScript. Capturas revisadas para rosto, escala e camadas. Isso não representa playtest humano de balanceamento.
