> Integração aplicada ao jogo. Consulte `docs/LARANJAO-ARTE-V1.md` na raiz do repositório para o estado atual. O conteúdo abaixo registra o contrato de produção que orientou esta importação; os originais completos permanecem no Dropbox.

# Laranjão — contrato de integração da arte

Referência de regras: `src/data/characters/laranjao.js`, blob `1acfa9e907dccc7a85840676dc80acb0a5008db1`. O mesmo blob foi confirmado na branch principal durante esta entrega. A cópia usada nos testes fica em `producao/referencia/`. Este documento orienta apresentação, preservando as regras existentes.

## Corpo e timing

Planejar cache de FX para camadas simultâneas (campo, cargas, placas, parede e transientes), usando dez tiras decodificadas como ponto inicial a validar na integração. O perfil registra essa necessidade, mas o motor precisa aplicá-la explicitamente em spriteOptions.

Registrar `laranjao` e `laranjao-fx` como pacotes de seis quadros, célula500 e alpha real. As 40 ações cobrem 19 estados, 19 movimentos e os turbos2S/6S. Usar `spriteStatePhases`, `spriteRecovery` e os fatores de `perfil-runtime.json`.

**O motor não lê `cues`.** Copiar apenas o perfil não liga a cronologia aprovada. O adaptador pronto em `producao/laranjao-timing.mjs` precisa de uma chamada explícita em `spriteProgress`, recebendo `SYS` do jogo:

```js
if (f.ch.id === 'laranjao' && f.ch.spriteProfile === 'six-frame')
  return laranjaoProgress(f, animation, SYS);
```

Os índices0/1 são antecipação,2/3 contato/emissão,4/5 recuperação. Tuitada normal emite na pose2 no quadro13. A turbo emite nas poses2/3 nos quadros9/15, mantendo a primeira emissão até a segunda. Fake News emite no quadro12; THE WALL no14; You're Fired! tem contato17–22. `cues` registra as demais janelas reais. Os três testes em `producao/laranjao-timing.test.mjs` exercitam todas as 21 variantes.

O encaixe para uma silhueta caber na célula e sua escala física são informações diferentes. Compensar apenas `fitScale`, preservando `physicalScale`. Não aplicar zoom extra quando ele agacha, rola ou encolhe no ar.

## Fake News

As cópias em combate devem usar **a mesma tira e o mesmo índice do dono**, com outra posição, manchete e `ghost:true`. O verdadeiro é o único com sombra. Não desenhar clones sempre em idle enquanto o dono ataca, pois isso revelaria o verdadeiro pela animação. `clone-parado` é um fallback para idle/revisão. `clone-surgir`, `clone-romper` e `fake-news-troca` são camadas de efeito separadas.

A placa `manchete-placa` está vazia: escrever as manchetes de `HEADLINES` pelo motor. Não introduzir texto na textura nem uniformizar as manchetes contraditórias.

## Tarifa Suprema e ataques

Desenhar até três instâncias de `armadura-carga`, de acordo com `f.res.armor`. `armadura-campo` acompanha o corpo; `tarifa-coleta`, `armadura-impacto` e `armadura-ruptura` seguem os eventos reais de ganho, absorção e perda. Essas imagens não acrescentam invulnerabilidade, dano ou cargas.

`tuitada-projetil` segue a entidade `tuite`; `tuitada-impacto` acompanha o contato; o rastro turbo acompanha as emissões reais. `tarifaco-rastro` e `veto-arco` acompanham as janelas ativas correspondentes. Corpos e efeitos são camadas distintas.

## THE WALL

A entidade é a autoridade para posição e colisão: **120×640**, vida420 e seis pontos de integridade. A arte tem construção própria; usar encaixe vertical explícito para o retângulo da entidade, com o pé no chão. Não usar `contain` proporcional de `drawSpriteLayer` para uma caixa120×640, pois isso deixaria parte da altura de colisão sem arte.

Usar os limites do **corpo sólido** da parede para mapear a arte ao collider; faíscas e linhas de velocidade podem se estender além desse retângulo. Não incluir linhas altas no cálculo que determina a altura visível da parede. `limites-muralha.json` registra o corpo sólido por quadro para esse encaixe.

`muralha-queda` acompanha a animação de entrada já usada pelo render. Parede intacta usa `muralha-erguida`; parede ferida usa `muralha-danos` no índice `6 - hp`, limitado0..5. Essas seis poses são estados de integridade, não um ciclo automático de dano. O rompimento usa `muralha-destruir`, mantendo a escala inicial ao reduzir a pilha de destroços. `muralha-impacto-chao` acompanha a chegada ao chão.

## You're Fired!

O alvo fica banido por120quadros e reaparece em altura620, com velocidade inicial−4; o dano de retorno é1500 nas regras existentes. O evento `unbanish` não é um pouso.

`banimento-selo` e `banimento-portal` acompanham a aplicação do banimento. Em `banimento-retorno`, índices0/1/2 acompanham o reaparecimento na altura real; o índice2 pode ser mantido até a queda terminar. Somente o pouso real inicia índices3/4/5 do impacto baixo, ancorados ao chão. Não antecipar esse impacto ao evento `unbanish`.

## Reprodução

A partir da pasta raiz deste kit, após disponibilizar Sharp conforme `producao/package.json`:

```sh
node producao/atualizar-planos.mjs .
node producao/exportar-sharp.mjs .
node producao/perfil-runtime.mjs .
node producao/gerar-limites-muralha.mjs .
node producao/montar-previa.mjs .
node producao/verificar-sharp.mjs .
node --test producao/laranjao-timing.test.mjs
```

A prévia standalone valida a entrega visual; integração, execução no jogo e playtest têm de ser registrados separadamente quando forem realizados.
