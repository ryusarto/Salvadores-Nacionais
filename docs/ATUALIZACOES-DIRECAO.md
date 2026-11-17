# Atualizações de direção — 17/11/2026

## História aprovada

A História enfrenta exclusivamente os sete chefes e começa na Capeta Zanata.
Os Salvadores são aliados em todas as cenas da campanha. As tabelas e os
diálogos que montavam duelos entre heróis foram retirados da História.
A sequência antiga e a opção de campanha Clássica não são oferecidas.
Os modos Versus preservam os confrontos entre personagens.

Os capítulos concluídos de saves anteriores são preservados. Um checkpoint
antigo de duelo é substituído pelo chefe do capítulo. Cada round do Djabo
recomeça na forma política; esvaziar a primeira vida aciona o demônio.

## Correções e melhorias integradas

- Reset completo após KO no Treino, sem boneco preso no estado de nocaute.
- Seletor de rivais em quatro linhas, sem sobreposição do painel descritivo.
- Menus semânticos clicáveis, com navegação por teclado e interface nativa de
  toque. Os botões de combate não ficam sobre os menus.
- Pausa ao girar para retrato, ocultar a página ou perder o foco da janela;
  retorno pela opção Continuar, sem reinício automático da luta.
- Botão próprio de agarrão e ação Questionar no touch; ferramentas de Treino
  para caixas, boneco, CPU e reset, sem depender de F1/F2/F3.
- Opções persistidas de posição/tamanho dos controles e redução de tremor e
  clarões de tela. A opção não remove flashes assados em sprites existentes.
- Aprendizado jogável de movimento, defesa, combo básico e combo aéreo.
  Etapas puladas ficam separadas das cumpridas.
- Checkpoint por encontro, validação de tipos/faixas dos saves e galeria de
  finais liberados por herói.
- Arena resolvida por capítulo, com palco e banheiros provisórios distintos.
  Pacotes pintados podem substituir o desenho provisório por manifestos.
- Áudio selecionado por arena; feira, água e trilha de Belém não acompanham
  automaticamente o jogador a outros lugares. Sem trilha entregue, há sons
  de combate, sem afirmar que a música final está pronta.
- Registro de perfis de sprite orientado pela ficha do personagem, incluindo
  novos chefes, FX e arte lateral. Pré-carga inclui defesa e dano básico.
- `npm run dev` inicia um servidor real e recompila mudanças em src/.
- Instrumentos de equilíbrio separam torneio de heróis e confrontos com
  chefes; o teste de dificuldade usa o multiplicador correto de chefes.

## Validação

Os testes de regressão cobrem KO no Treino, rounds do Djabo, rota sem aliados,
saves inválidos e migração de checkpoint, resolução de arena e perfis de
sprites. O smoke de navegador cobre começo da campanha na Zanata, os 16
rivais visíveis, áudio sem vazamento de Belém, menus touch, ferramentas do
Treino, pausa por orientação, persistência de opções e etapas do tutorial.

`npm run check:campaign` exercita todos os 56 confrontos de herói × chefe com
IA e verifica término e estado numérico válido. Essas verificações não
certificam equilíbrio humano, latência de controle físico ou desempenho em
telefone real. Nenhum dano ou HP foi reajustado pelos resultados do bot.

## Produção artística pendente

Sprites finais dos chefes, cinco golpes sem tira própria, fechamento de
unidade visual, cenários pintados posteriores, páginas de HQ e trilhas por
arena dependem do chat de arte. A fila e o contrato estão em
[PRODUCAO-ARTE.md](PRODUCAO-ARTE.md). Não foram substituídas artes aprovadas,
nem foram gerados assets provisórios para apresentar a fila como concluída.
