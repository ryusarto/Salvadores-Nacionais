# Laranjão — arte integrada, seis quadros

O chefe do capítulo 6 usa as 40 animações de corpo (240 desenhos) e as 24 sequências de efeitos (144 desenhos) aprovadas. São 64 atlas de 3000 × 500, com transparência real, convertidos para WebP lossless. Retrato e ícone substituem as versões provisórias nos menus e no HUD. O apoio do corpo fica em (250, 456), com escala visual 0,76.

O combate continua definido em `src/data/characters/laranjao.js` e `src/core/`. A integração acrescenta perfil visual e identificação do ator em eventos de apresentação. Dano, colisões, custos, tempos, quantidade de cópias e resistência da muralha preservam as regras existentes.

- Os 19 movimentos e suas duas variantes turbo usam antecipação nos índices 0/1, contato ou emissão em 2/3 e recuperação em 4/5. `src/render/laranjao-timing.js` é chamado explicitamente em `spriteProgress`.
- Fake News reaproveita a mesma tira, quadro, relógio, pose decodificada, direção e armadura do dono. As duas cópias não têm sombra. Surgimento, troca e coleta de tarifa aparecem em todos os candidatos. Pops redundantes de ativação/coleta são substituídos pelos efeitos nativos quando existem cópias, para preservar a leitura das manchetes. O impacto em uma cópia continua local ao contato.
- As manchetes são texto dinâmico sobre a placa nativa sem texto. As três cargas de armadura e seu campo leem o recurso real; absorção, ruptura e coleta têm efeitos próprios.
- Tuitada usa projétil, impacto e rastro turbo separados. Tarifaço e Veto usam rastro e arco próprios durante suas janelas reais.
- THE WALL desenha o corpo denso de cada célula exatamente sobre o collider de 120 × 640. Os seis níveis de resistência usam `6 - hp`; surgimento, impacto no chão e destruição são próprios. A destruição conserva a transformação inicial para que os escombros encolham. Expiração e substituição também encerram o efeito visual.
- You're Fired mantém o banimento de 120 quadros. Selo e portal substituem a apresentação anterior. No retorno, os índices 0/1/2 seguem a altura real do alvo; o índice 2 é mantido no ar. Os índices 3/4/5 começam somente quando ele realmente toca o chão. Bloqueio e salto continuam evitando o banimento.
- O observador de efeitos guarda estado somente no renderizador e é reiniciado com a luta/rodada. O pacote admite dez tiras decodificadas para acomodar efeitos persistentes e transientes.

Os 64 PNGs finais, manifestos, limites da muralha e registros de produção ficam em `production/sprites/source/laranjao-v1/`. As tiras carregadas pelo jogo ficam em `production/sprites/final/laranjao{,-fx}/`. Os grupos nativos de três poses, correções rejeitadas e exportações individuais completas continuam preservados no Dropbox em `T&H/Assets/Salvadores Nacionais/laranjao-v1-6quadros`.

Reproduzir:

```sh
npm ci
npm run art:laranjao
npm test
npm run check:campaign
npm run test:laranjao
```

O teste de navegador usa Chrome no macOS ou o executável indicado em `CHROMIUM_PATH`. A galeria é `production/qa/laranjao-v1.html`; o jogo é `dist/salvadores-nacionais.html`. Sirva a raiz por HTTP. Capturas e relatório ficam em `artifacts/laranjao/`.

Validação: 246 testes da suíte completa aprovados; comparação RGBA dos 384 desenhos contra os PNGs aprovados; 21 variantes de timing; seis estados de resistência e seis contatos reais na muralha; teste de bloqueio/salto; retorno até o pouso; cache persistente; 80 cenas no Chrome nos dois sentidos; 64 atlas decodificados; desktop e viewport móvel sem erros HTTP/JavaScript. Revisão independente estática/automatizada aprovada, incluindo reprodução de Fake News e tarifa em 20 seeds reais. Capturas de corpo, ataques, muralha e clones/armadura foram revisadas visualmente. Isto não representa playtest humano de balanceamento.
