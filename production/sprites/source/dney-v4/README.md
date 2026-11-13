# Dney v4 — lacunas de animação

15 sequências inéditas, 4 desenhos por sequência, baseadas nas referências do Dney fornecidas pelo autor.

- Locomoção: caminhada reversa e recuo rápido.
- Golpes: 5L, 2L, 2M, 2H, 3H, 6M, jL, jM, jH, throw e blindado.
- Recuperação: escape de agarrão e rolamento ao cair.

As tiras normalizadas consumidas pelo jogo estão em
`production/sprites/final/dney/`: WebP sem perdas, 4 células de 512×512.
O leitor amplia cada célula para 768×768 no mundo, com origem dos pés em (384,700).
O manifest.json registra pedidos de geração, recortes, escala única por tira e hashes dos arquivos de uso.
Os PNG originais em alta resolução são entregues separadamente no arquivo local
`DNEY_COMPLETO_FONTES.zip`; não estão nesta pasta do GitHub.
Esta build usa referências a imagens externas, mantendo o HTML pequeno.
O comando direto `node tools/build.mjs` conserva a opção de gerar um HTML offline com tudo embutido.

O novo kit substitui os aliases desses golpes; o chute aéreo forte deixa de ser uma cópia do tiro aéreo.
O impacto acompanha os quadros ativos do golpe. O recuo percorre sua tira em 21 quadros.
O agarrão mostra alcance, captura, soltura e recuperação conforme a simulação.
Escape e rolamento têm seleção própria apenas para personagens com spriteRecovery ativado.

Revisão no navegador: `production/qa/dney-sprites.html` (servir a raiz do repositório por HTTP).
A página compara 60 desenhos do leitor real com a tira solicitada, permite pausar, trocar lado e avançar quadro.
Evidências: `production/qa/evidence/dney-v4-all.png` e `dney-v4-training.png`.

Verificação em 13/11/2026:
- 44 testes Node passaram, incluindo direção relativa, reinício do recuo, quadros de impacto, agarrão e exclusividade de imagens.
- Build gerada com 42 tiras de Dney.
- 60 comparações de imagem passaram no navegador.
- Conferência visual das tiras e do espelhamento; abertura e comandos de movimento/golpe no treino.

Esses checks não substituem um playtest extenso de balanceamento nem aprovação artística do autor.
As demais animações existentes do Dney não foram redesenhadas nesta entrega. O Franco permanece para a próxima etapa.
