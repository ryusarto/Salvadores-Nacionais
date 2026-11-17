# Salvadores Nacionais — briefing de direção para o chat de arte

Base da auditoria: main, `86121d9`, 17/11/2026. Este briefing é uma proposta de fila baseada no material integrado. Antes de executar, cruzar cada pedido com o que já está em produção na outra conversa. Não houve acesso ao histórico desse chat nem envio automático de mensagens.

## Direção que proponho fixar

**HQ de rua brasileira, com personagens reconhecíveis e combate legível em tela pequena.** Interface com tinta preta, amarelo, vermelho e creme; personagens com contorno e sombra consistentes; cenário detalhado sem competir com o plano de combate. A sátira precisa aparecer em ação, não apenas em texto.

Não proponho redesenhar todos os heróis agora. O jogo já tem seus oito kits; faltam sobretudo fechamento de unidade, cinco golpes específicos e o acabamento dos antagonistas. Comparar o elenco e os chefes dentro da build atual em desktop e mobile. A pasta `artifacts/smoke/` recebe capturas locais do teste de navegador.

## Primeiro lote: referência e lacunas objetivas

| ID | Entrega | Problema que resolve | Aceite |
|---|---|---|---|
| ART-01 | Prancha única dos oito heróis e dos sete chefes, com duas formas de Djabo | Cada pacote isolado pode parecer aprovado sem formar um elenco | Vista no tamanho do jogo, escala de cabeça/corpo, contorno, luz e paleta comparáveis; referência canônica de figurino identificada |
| ART-02 | Zanata: conceito final, retrato, ícone e pequeno kit de movimento/ataque/defesa/dano | Primeiro chefe ainda é manequim e o retrato não segue a mesma linguagem dos heróis | Franco × Zanata em Belém parece um único jogo; chicote comunica preparação, alcance, contato e recuperação |
| ART-03 | Belga `golpe-6H`, Chute Giratório | Hoje usa a animação do soco `6S` | Chute claramente distinguível de Direto de Esquerda, com apoio e contato compatíveis com a regra |
| ART-04 | Belga `golpe-4H`, Joelhada | Hoje usa a animação de `2H` | Joelho e trajetória de lançamento legíveis, sem alterar volume aparente entre os quadros |
| ART-05 | M’Dep `golpe-6H`, Cruzado | Hoje usa Blindado | Soco identificável, com braço, tronco e apoio coerentes |
| ART-06 | M’Dep `golpe-4H`, Upper de Esquerda | Hoje usa `2H` | Esquerda preservada pela referência, lançamento e posição do corpo claros |
| ART-07 | M’Dep `golpe-4M`, Jab Duplo | Hoje usa Blindado | Dois contatos próprios nos quadros de acerto reais; não repetir um frame para fingir segundo golpe |

A referência visual de Franco × Zanata é o marco de qualidade, não a aprovação automática de um estilo novo. Levar o material ao jogo antes de gerar dezenas de tiras de chefes.

## Segundo lote: chefes e seus objetos de mecânica

Cada chefe precisa de retrato e ícone finais, corpo em jogo, estados básicos e golpes próprios; a lista de movimentos vem da ficha atual, não de uma lista imaginada. O objeto que explica o contrajogo é parte da prioridade, não um enfeite posterior.

| ID | Chefe | Elementos obrigatórios de leitura |
|---|---|---|
| ART-08 | Chupetinha | Mangual de chupeta; celular como alvo separado; três sinais de resistência; live ativa, interrupção, cura e retorno claramente distintos |
| ART-09 | Pavanassi | Carimbo; proibições de especial/pulo/super com símbolos e texto; cerca quebrável; cabine e fila; reação à Pergunta; dissolução dos decretos |
| ART-10 | Fujão | Mala, tropeço e carrinho; preparação da fuga; escada do avião; sinal de cura por embarque; encurralamento visível |
| ART-11 | Pai do Fujão | Bengala, telefone e capangas; zona de tornozeleira precisa; aviso e choque fora dela; Foro ativo/cassado; fúria reconhecível |
| ART-12 | Laranjão | Cópias legíveis sem sombra, verdadeiro com sombra; níveis de armadura; muralha com desgaste; aviso de banimento e retorno |
| ART-13 | Djabo | Silhuetas distintas de político e demônio; transformação; golpes roubados reconhecíveis; tridente, colunas com aviso; zona segura do Inferno Nacional |

Fazer as pistas funcionarem em tamanho pequeno, sem depender só de vermelho/verde ou de texto sobre efeitos intensos. A zona segura do Inferno e a área da tornozeleira precisam coincidir com a geometria da regra.

## Terceiro lote: cenários e narrativa

| ID | Entrega | Condição de direção |
|---|---|---|
| ART-14 | Belém — frente do palco | Pacote modular v1 entregue: 87 assets, 108 quadros ambientais e seis áudios; fontes, inventário e prévia em `production/stages/palco/README.md` |
| ART-15 | Belém — banheiros químicos | Local reconhecível; cercas/cabine de gameplay não confundidas com cenário; vitória mostra inclusão e retirada das proibições |
| ART-16 | Aeroporto | Pista, avião, escada e referência de embarque; contraste compatível com Belém; chão de luta plano e legível |
| ART-17 | Mansão, interior | Sala, telefone, retrato do filho, lustre e sofá; zona da tornozeleira destaca sem parecer decoração |
| ART-18 | Washington | Palácio, gramado, bandeiras e muralha; detalhe de cenário não apaga clones, sombra e armadura |
| ART-19 | Inferno | Trono, correntes e fogo; separar fogo decorativo, ataque anunciado, área perigosa e trecho seguro |
| ART-20 | Sequência HQ da campanha | Apenas após ajustar texto/ritmo: ação coletiva e comida, transições de local, revelação dos mandantes, libertação e final de cada herói |

Palco e banheiros ainda exigem criação/seleção de cena no código. As outras quatro arenas já existem como desenho programático, mas não no acabamento de Belém. Produzir imagem não conclui essa integração.

A História agora tem apenas sete confrontos contra chefes, começando na Zanata. Não produzir cenas de combate entre aliados. Saguão, portão e gramado podem mostrar apoio e mobilização do grupo; a arena segue o capítulo.

## Contrato técnico a respeitar

- Não há um formato único hoje. Belga, Trunks e Ryuchi usam kits de seis células de 500×500; M’Dep usa dez de 768×768; outros heróis têm perfil próprio. **Não converter todos os kits durante um ajuste visual.**
- Para os cinco golpes faltantes, seguir o perfil do personagem: Belga seis células de 500, M’Dep dez de 768. Runtime em tira horizontal, uma ação por arquivo, com alpha verdadeiro. Mestres em PNG; WebP como exportação de runtime quando apropriado.
- A ancoragem do render é normalizada: centro horizontal e pés em `700/768` da altura. Em célula 768 corresponde a (384,700); em 500 corresponde aproximadamente a (250,456), sujeito ao contrato existente do pacote. Não centralizar o corpo automaticamente em cada pose.
- O runtime ainda identifica alguns perfis por ID em main.js. Definir o perfil dos chefes com quem integra **antes** de produzir o kit inteiro. Pedir seis quadros para todos sem ajustar o registro não garante sincronismo correto.
- Usar os nomes esperados por `src/render/anim.js`, as chaves de `src/data/characters/<id>.js` e, quando necessário, os guias de `src/tools/guides.js`. Estado, preparação, contato e recuperação precisam corresponder ao motor de 60 Hz. Não copiar os mesmos quatro tempos para todo golpe.
- O número de quadros do atlas não é a duração do golpe: cinco frames de preparação podem ocupar tempos diferentes de cinco de recuperação. Entregar mapa de poses de contato para os golpes com múltiplos acertos.
- Efeitos e ajudantes em camadas separadas, especialmente spray, cachorros, ambulância, tiro, laser, vinil, guitarra e avisos dos chefes. Não assar grandes flashes no corpo.
- Ryuchi já tem arte própria dos dois sentidos. Preservar mão, katana, bainha e identidade lateral. Não substituir esse contrato por espelhamento genérico.
- Não aumentar resolução por padrão. Uma tira de dez células 768² já ocupa 22,5 MiB em RGBA antes de cópias e texturas. Trabalhar com orçamento de memória e teste no jogo.
- Fundos em camadas com dimensões, faixas de parallax, piso, área útil e posição do horizonte documentados. Compartilhar escala e linha de chão com os personagens. A cena lógica atual tem viewport 1920×1080, mundo com largura 2600 e pés no chão em y=930.

## Critérios de aprovação visual

1. Reconhecer personagem e ação no tamanho real de um celular, em vez de julgar só o PNG ampliado.
2. Cabeça, mãos, roupa, arma e volume estáveis entre tiras e quadros; pernas e pés sem deslize indevido.
3. Pose de contato coincide com alcance e altura reais; sem golpe que parece soco mas resolve chute.
4. Silhueta visível em Belém e nas quatro arenas posteriores; sombra e apoio coerentes.
5. Efeito comunica o que é ataque, perigo, defesa e decoração; não cobre o adversário durante toda a resposta.
6. Primeira execução do golpe, espelhamento, troca de lado e luta com personagem repetido verificadas.
7. Retrato, ícone, sprite e HQ apresentam o figurino/rosto aprovados para a mesma versão do personagem.
8. Contraste e espaço de HUD/toque respeitados; validação em três escalas: desktop 16:9, celular largo e celular 16:9.

## Como trocar entregas entre os dois chats

Para cada ID, devolver: referência aprovada, arquivos e manifesto, versão, mudanças desde o lote anterior, preview em escala de jogo e eventuais dúvidas de regra. Eu reviso a integração e devolvo aceite ou ajuste por ID.

Não renomear, mover ou substituir assets finais que o outro chat possa estar atualizando sem conferir a versão. Esta revisão mantém o checkout limpo e os pedidos separados do código. Novas artes ainda não integradas ao Git não foram consideradas ausentes de produção: estão apenas ausentes deste diagnóstico do jogo executável.

## Estado da integração após esta atualização

A campanha de chefes, os menus de toque, a pausa por rotação, o reset do Treino
e os checkpoints estão implementados. Novos pacotes de arena podem declarar
`assets` e `layers` em `production/stages/<id>/manifest.json`. Cada layer usa
`asset`, `factor`, `y` e `height`; a ordem define o desenho. Arquivos de áudio
usam `kind: "audio"`, IDs `trilha-intro` e `trilha-loop` ou nomes de ambientes.
IDs das arenas: `belem`, `palco`, `banheiros`, `aeroporto`, `mansao`,
`washington`, `inferno`. Sem pacote próprio não se toca a trilha de Belém em
outro local. Os efeitos de combate continuam ativos.

O registro de sprites agora consulta `spriteProfile` da ficha também para
novos chefes, suas camadas FX e variantes laterais. Isso prepara a integração,
mas não representa entrega dos pixels finais. ART-03 a ART-20 continuam
pendentes de produção/aprovação conforme o estado do outro chat.

## Zanata v1 entregue

ART-02 agora tem kit completo: 41 animações de corpo e 12 FX por sentido,
636 quadros, retrato e ícone. Fontes, contrato e manifestos ficam em
`production/sprites/source/zanata-v1/`; galeria em
`production/qa/zanata-sprites.html`. A primeira geração e sua validação não
substituem uma futura rodada de direção de arte com jogadores no aparelho
alvo. Não gerar um segundo kit da Zanata em paralelo sem conferir esta versão.
