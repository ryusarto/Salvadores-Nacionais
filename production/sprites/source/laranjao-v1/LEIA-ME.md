> Integração aplicada ao jogo. Consulte `docs/LARANJAO-ARTE-V1.md` na raiz do repositório para o estado atual. O conteúdo abaixo registra o contrato de produção que orientou esta importação; os originais completos permanecem no Dropbox.

# Laranjão — pacote de arte v1, seis quadros

Kit do sexto chefe de Salvadores Nacionais, no padrão das criações anteriores. São **40 animações de corpo (240 quadros)** e **24 sequências de efeitos/clone (144 quadros)**: **384 desenhos**, seis por ação. Cada sequência foi produzida em dois grupos nativos de três poses para preservar o detalhe.

O personagem usa terno azul-marinho, camisa branca, gravata vermelha longa, pequeno broche de bandeira, sapatos pretos, cabelo louro e aparência robusta. As poses compactas foram revisadas contra o sprite parado para manter a escala de cabeça, mãos e sapatos.

## Arquivos

- `painel-personagem.png` e `painel-efeitos.png`: painéis de revisão com seis exemplos.
- `previa.html`: galeria animada, seleção de todas as ações, pausa, avanço quadro a quadro, espelho e fundos de revisão. Pode ser aberta localmente; o inventário está embutido.
- `tiras/`: 40 tiras PNG de corpo, 3000×500, seis células de 500×500.
- `quadros/`: os 240 PNGs individuais de corpo.
- `mestres-768/`: 40 tiras mestre, 4608×768.
- `pranchas/`: pranchas de seis quadros, 1500×1000.
- `fx/`: a mesma organização para as 24 sequências de efeitos e clone.
- `originais/` e `fx/originais/`: as 128 imagens nativas finais, três poses por imagem.
- `ui/retrato.png` e `ui/icone.png`: imagens de interface derivadas do retrato nativo.
- `referencias/`: modelo, retrato e fotografias fornecidas para referência visual.
- `manifest.json`, `validacao.json`, `perfil-runtime.json`: inventário, verificação dos PNGs e proposta de integração.
- `producao/jobs.json`, `producao/fx-jobs.json` e seus diários em `geracoes/` e `fx-geracoes/`: fases, prompts completos, referências e procedência.
- `correcoes/rejeitados/`: histórico preservado das fontes substituídas durante a revisão; não usar como assets finais.

## Habilidades cobertas

Fake News, manchetes dinâmicas, aparecimento/rompimento/troca dos clones; Tuitada normal e turbo; Tarifaço normal e turbo; Veto Presidencial; coleta, cargas, campo, absorção e ruptura da armadura; THE WALL com seis estados de integridade, queda, permanência, destruição e impacto; banimento, selo e retorno de You're Fired!; impacto de combate.

Sombras, texto das manchetes e contadores são desenhados pelo jogo. Os PNGs de corpo preservam o personagem e sua roupa, com efeitos em camadas próprias.

## Padrão técnico

PNG RGBA com transparência real. Apoio na célula500: **(250,456)**; na célula768: **(384,700)**. O espelhamento é responsabilidade do motor. Os mestres são derivados diretamente das fontes nativas, sem ampliar os desenhos. `physicalScale` registra calibração física; `fitScale` registra apenas o encaixe na célula; só este último pode receber compensação em tempo de execução.

A arte foi criada com a ferramenta integrada **image_gen**. Sharp e os utilitários PNG fazem somente recorte, redimensionamento e exportação determinística. Os prompts e os originais estão preservados neste pacote.

## Validação e integração

Consulte `validacao.json` e `producao/auditoria-fontes-final.json` para a verificação final. `producao/revisao-independente.json` delimita a revisão visual das fontes e do mapeamento. Há três testes do adaptador de apresentação cobrindo 21 variantes de movimentos.

O pacote é uma entrega de arte para revisão. A integração do Laranjão ao jogo deve seguir `INTEGRACAO.md`, inclusive o adaptador de timing, as cópias sem sombra, o encaixe da muralha e o pouso após banimento. As regras existentes estão documentadas como referência; este pacote não publica alterações no jogo.

Para reproduzir a exportação rápida, instale a dependência declarada em `producao/package.json` e execute, dentro de `producao`, `npm run export`. Depois execute os scripts de perfil, prévia e verificação indicados em `INTEGRACAO.md`.

O inventário completo está em `inventario-arquivos.json`; os hashes RGBA dos quadros foram comparados aos PNGs na validação. A confirmação remota de caminhos e tamanhos fica em `producao/dropbox-verificacao.json`.
