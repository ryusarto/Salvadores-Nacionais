# Capeta Zanata — sprites v1

Pacote desenhado a partir das referências fornecidas no chat: cabelo loiro
com raiz escura, coroa de flores, colar e figurino de blusa preta de pequenos
pontos brancos, calça preta e botas de salto. O estilo segue o desenho
pintado com contorno escuro do elenco. Não incorpora armas das fotografias.

## Conteúdo

Por sentido: 19 estados, 19 golpes e três versões turbinadas, além de 12
efeitos. Total: **106 tiras, 636 quadros**, seis desenhos por tira, com
fontes geradas separadamente para direita e esquerda. Não há espelhamento
por software nem duplicação de quadro para preencher uma animação.

- `originais/direita/` e `originais/esquerda/`: fontes 1536×1024 em grade 3×2.
- `tiras/<sentido>/`: PNGs de exportação 3000×500, RGBA e alpha real.
- `manifest-<sentido>.json`: hashes, dimensões, recortes, escala, seis
  registros de quadros e ponto de pega do chicote estimado pela máscara de pele.
- `prompts/`: instruções de geração preservadas; `PLANO.json`: contrato e
  quadros de contato do motor que orientaram cada ação.
- `referencias/retrato-gerado.png`: retrato de alta resolução produzido a
  partir do modelo. As fotografias anexadas ao chat não foram exportadas
  automaticamente como arquivos; não as apresentamos como cópias arquivadas.
- `rejeitados/`: tentativas substituídas por correções feitas com geração
  de imagem. Não são assets de runtime.

## Exportação e uso

Com `npm ci`, rode `node tools/import-zanata.mjs` na raiz do repositório.
O importador separa as seis poses, preserva membros e adereços em pequenos
gutters, normaliza ruído de alpha abaixo de 5% e rejeita fontes cortadas,
quadros vazios e repetições. A escala é única para cada sequência e nunca
amplia a fonte. O formato final tem células de 500px e apoio em (250,456).

`node tools/zanata-preview.mjs` reconstrói a galeria
`production/qa/zanata-sprites.html`. Sirva a raiz do projeto por HTTP para
revisar ambos os sentidos, as seis poses e os efeitos separadamente.

Os arquivos finais entram em `production/sprites/final/zanata/`,
`zanata-esquerda/`, `zanata-fx/` e `zanata-esquerda-fx/`.

## Sincronização

A ficha ativa o perfil de seis quadros. Para golpes comuns: preparação,
antecipação, aproximação, contato, acompanhamento e recuperação. A pose
de contato acompanha a hitbox real, inclusive a recuperação encurtada em
Fúria. A Tempestade alterna poses nos cinco acertos; Intimação separa captura,
puxão e golpe final. Turbos têm tiras próprias.

O corpo desenha a empunhadura. O chicote flexível é uma camada independente
que parte do ponto de pega e alcança a caixa de acerto do código. Laço,
varredura, faíscas, Salto Agulha, supers, Fúria, impacto, defesa, poeira,
armadura e puxão possuem arte própria. Efeitos usam recorte e origem central,
sem forçar alinhamento de pés. Nenhuma regra de dano, alcance ou IA é alterada.

## Validação e cópia de segurança

`node --test tests/unit/zanata-art.test.js` verifica cobertura integral,
seis quadros distintos, hashes, alpha, bordas e contato nas janelas reais.
Os testes de navegador devem conferir ambos os sentidos dentro do jogo;
a presença de arquivo não basta para aprovar a apresentação.

GitHub é o destino principal de versionamento. A branch `assets/zanata-v1`
recebeu um primeiro lote de fontes durante a produção; a integração final
é publicada no main após validação. `node tools/backup-zanata.mjs` gera um
ZIP local organizado com manifesto SHA-256, fontes, PNGs, WebP, retrato,
prévia e código de integração. Isso não implica upload a Drive ou Dropbox.
