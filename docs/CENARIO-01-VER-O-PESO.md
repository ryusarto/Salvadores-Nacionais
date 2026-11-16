# Primeiro cenário — Belém / Ver-o-Peso

**Produzido e integrado:** os 36 grupos estão completos, com 45 arquivos de
entrega e 66 frames de animação ambiental. As três fotos fornecidas pelo
usuário orientam o Mercado de Ferro, casario, barcos, paneiros e Catedral da
Sé, reinterpretados em vista lateral e luz de fim de tarde. O
[manifesto](../production/stages/belem/manifest.json) registra cada entrega;
a [prévia](../production/qa/belem-cenario.html) permite conferir a montagem.
Este documento conserva a especificação e o roteiro de produção usados.

## Composição e limites reais do jogo

O viewport é **1920×1080**, o mundo tem **2600px** de largura e a câmera
percorre **680px**. Os pés dos lutadores ficam em **Y=930**; o início visual
do calçamento está em **Y=826**. Essa faixa deve continuar livre e legível.
A escala da arquitetura, NPCs, bancas e sombras deve ser aprovada junto dos
lutadores, incluindo saltos, agachamentos e supers.

| Camada | Parallax | Largura mínima × altura | Conteúdo |
|---|---:|---:|---|
| Céu | 0 | 1920×1080 | Gradiente e luz do fim de tarde |
| Nuvens | 0,08 | 1975×1080 | Nuvens recortadas, sem cenário incorporado |
| Horizonte | 0,18 | 2043×1080 | Silhueta distante, baía e porto |
| Água | 0,18 | 2043×1080 | Base separada da ondulação e dos reflexos |
| Arquitetura | 0,42 | 2206×1080 | Mercado de Ferro, torres e casario |
| Feira | 0,78 | 2451×1080 | Barracas e bancas, sem pessoas incorporadas |
| Primeiro plano | 1,05 | 2634×1080 | Detalhes nas bordas, sem cobrir a luta |

As larguras seguem `ceil(1920 + 680 × parallax)`, para a câmera não revelar
bordas vazias. Recortes podem ser exportados menores quando o manifesto
registrar a origem exata dentro desse canvas. Céu e textura do chão são
opacos; as demais camadas e objetos recortados usam alpha real.

O calçamento precisa de uma **textura repetível de 1024×1024**, sem perspectiva
pintada. O renderer deverá projetá-la no plano do chão e manter o movimento
coerente com a câmera. Não incorporar sombras dos personagens à textura.

## Inventário completo

- **8 bases visuais:** céu, nuvens, horizonte, água, arquitetura, feira,
  textura do calçamento e primeiro plano.
- **8 famílias de objetos, 17 variantes:** barracas, bancas de frutas,
  caixas, cestos/paneiros, postes, barcos, folhagem e bandeirolas.
- **8 animações:** ondulação da água, balanço de barco, toldo, bandeirolas,
  folhagem e três tipos de NPC: feirante, cliente e torcedor.
- **3 FX de ambiente:** poeira leve, luz de poste e reflexos ocasionais.
- **6 áudios:** introdução e loop musical, ambiente da feira, água, aves e
  vento/tecido. Os loops precisam de pontos de emenda e volume definidos.
- **3 peças de interface:** miniatura da fase, título vetorial e imagem de
  carregamento, que pode ser derivada da composição final.

Cada animação terá **uma imagem por ação e seis frames**, seguindo o formato
já usado: células de 500×500, tira de 3000×500 e mestre PNG 3×2 de 1500×1000.
NPCs terão escala de desenho consistente entre as ações e serão reduzidos no
mundo conforme a distância. Props estáticos terão um arquivo por variante.

## Direção de arte e continuidade

Traço de quadrinhos e sombras em blocos, compatíveis com os personagens.
Manter o fundo menos contrastado que os lutadores; detalhes de leitura
regional ficam concentrados no Mercado de Ferro, nas bancas, no porto e nos
barcos. Confirmar referências arquitetônicas antes da pintura final.

Luz quente do pôr do sol vindo sempre da mesma direção. A luz de contorno,
sombra de contato, água, reflexos e interiores das barracas devem concordar.
Retícula e textura de papel devem ser aplicadas uma única vez, sem acumular
um overlay sobre arte que já tenha esses efeitos.

Usar um mapa de posicionamento com ID, origem dos pés/base, escala, camada,
parallax e ordem de desenho para cada objeto. O público deve ficar atrás da
área de combate; a animação do barco não altera sua posição na água. Postes,
vegetação e primeiro plano não podem esconder mãos, pés ou projéteis.

## Integração necessária

O fallback `buildStage()` produz quatro camadas por código. O caminho opcional
`setStageImage()` aceita uma pintura única e substitui todo o cenário,
incluindo o chão. A implementação nova, em `src/render/belem-stage.js`, usa
um **carregador de camadas independentes**, com manifesto, recortes, parallax
e animações; `src/data/belem-stage.js` guarda os posicionamentos.

As bases novas substituem o cenário provisório quando carregadas. Não desenhar a
feira antiga atrás da nova, nem um público estático sob os mesmos NPCs
animados. Se a textura final já contiver juntas do piso, remover a grade
provisória equivalente. Os efeitos ambientais ficam separados dos FX dos
lutadores e nunca alteram colisão, câmera ou dano.

O carregador mantém fallback completo enquanto as bases essenciais carregam
ou se alguma falhar, sem misturar versões com perspectivas diferentes.
As texturas ficam em cache e as 11 tiras de ambiente são reutilizadas entre
objetos. `src/ui/audio.js` agenda introdução/loop e mixa os ambientes, com
desbloqueio por interação, botão SOM, silêncio em menus, pausa e aba oculta.
Os seis áudios são síntese original, sem gravações de campo.

## Ordem de produção

1. Fazer um bloqueio de composição com lutadores nas duas extremidades e no
   centro; aprovar perspectiva, horizonte, escala e paleta.
2. Produzir as cinco camadas principais e a textura do chão; integrar o
   carregador de camadas e validar todo o percurso da câmera.
3. Adicionar objetos modulares e os primeiros loops de água e feirante.
4. Completar NPCs, vento, barcos, FX, áudio e peças de interface.
5. Revisar em desktop e celular: leitura de golpes, emendas dos loops,
   alpha, ausência de duplicações e fluidez com dois personagens completos.

Aceitação: câmera de 0 a680 sem bordas vazias; pés emY930; chão coerente;
camadas sem fundo opaco indevido; loops sem saltos; nenhum objeto duplicado
pela versão provisória; palco legível durante o Agudo Supremo e outros supers.
