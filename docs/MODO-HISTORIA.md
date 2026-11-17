# Modo História — A Turnê contra a Fome

## Regra da campanha

A História começa **diretamente contra a Capeta Zanata**. Não há luta contra
outros Salvadores, disputa por ordem de palco ou batalha de rima obrigatória.
A campanha tem sete confrontos: um chefe por capítulo. Qualquer um dos oito
heróis pode completar a turnê e liberar seu próprio final.

O rap continua central: os aliados organizam shows, cozinhas, transporte,
acolhimento e mobilização enquanto o herói escolhido enfrenta quem tenta
impedir o evento. A cooperação deve ser mostrada nas falas e nas futuras
páginas de HQ. Duelos entre heróis ficam nos modos Versus.

## Percurso e função de cada chefe

| Capítulo | Confronto | Contexto e aprendizado |
|---|---|---|
| 1 | Capeta Zanata — Belém, Ver-o-Peso | Invade o primeiro evento; aproximar-se de quem controla a distância. |
| 2 | Chupetinha — frente do palco | Interrompe a segunda noite com sua live; atingir o celular e cortar a cura. |
| 3 | Pavanassi — banheiros químicos | Tenta excluir pessoas do evento; ler decretos, superar barreiras e questionar a cabine. |
| 4 | Fujão — aeroporto | O grupo abre passagem no saguão com apoio da população; o herói segue direto à pista para impedir a fuga. |
| 5 | Pai do Fujão — mansão | Os aliados mobilizam a cidade diante do portão; o herói enfrenta o mandante na sala e o tira da zona da tornozeleira. |
| 6 | Laranjão — Washington | A turnê atravessa fronteiras; os aliados organizam as mesas no gramado. Ler clones e gastar recursos com cuidado. |
| 7 | Djabo — inferno | Os aliados e as almas sustentam o refrão e abrem caminho até o trono; sobreviver às duas formas. |

A ordem é Zanata → Chupetinha → Pavanassi → Fujão → Pai do Fujão → Laranjão → Djabo.
O primeiro adversário nunca é um aliado, independentemente do herói escolhido.

## Estrutura de cada capítulo

1. Chegada em páginas de HQ, com o grupo cooperando.
2. Mapa e confirmação do confronto com o chefe.
3. Diálogo e dica sobre a mecânica do chefe.
4. Apresentação e luta.
5. Fechamento que mostra o evento acontecendo, a libertação da comunidade ou
   a informação que leva ao próximo mandante.

A dificuldade escolhida vale desde o primeiro chefe. Não existe mais um
primeiro duelo de rima com CPU reduzida. Cada partida segue a regra de dois
rounds vencidos. O Djabo começa **cada round** na forma política e se
transforma em demônio ao perder a primeira barra de vida.

## Progresso e continuação

- Progresso de capítulos separado por herói em `sn-historia`.
- Checkpoint do confronto atual e número de continues em
  `sn-historia-checkpoints`, versão 2.
- JSON inválido, índices fora da faixa e tipos inválidos são recuperados
  sem impedir o início da campanha.
- Saves antigos mantêm os capítulos concluídos. Checkpoints da sequência de
  duelos antigos não são retomados: a campanha retorna ao chefe correspondente.
- Vencer um capítulo antigo nunca diminui o progresso já conquistado.
- Perder permite repetir o mesmo chefe, sem limite de continues.
- Concluir os sete capítulos libera o final do herói no menu Finais.

## Continuidade e tom

O Fujão é entregue à segurança do aeroporto após a derrota; sua fuga é
interrompida. O texto não sugere que os heróis o mataram.

O alvo da sátira de Pavanassi é a autoridade que tenta excluir e classificar
as pessoas. A população defendida aparece acolhida e celebrando, nunca como
a piada. A retirada dos decretos e das placas precisa aparecer no fechamento.

O final assume a fantasia política da obra: a derrota do Djabo rompe as
correntes, o povo e os Salvadores se reúnem, as mesas se enchem pelo mundo e
a fome acaba. Cada herói tem uma página final própria. As futuras ilustrações
devem mostrar a ação coletiva e a transformação, além da manchete final.

## Arenas e som

A arena segue o capítulo, com variantes próprias para palco e banheiros.
Essas duas variantes são provisórias. Aeroporto, mansão, Washington e inferno
ainda têm cenários desenhados em código. A arte final segue a fila em
[PRODUCAO-ARTE.md](PRODUCAO-ARTE.md).

Pacotes em `production/stages/<id>/manifest.json` podem fornecer camadas e
áudio próprios. A trilha e os ambientes de Belém não são reutilizados
automaticamente no aeroporto, na mansão, em Washington ou no inferno.
Sem pacote de áudio da arena, permanecem os sons de combate; a trilha final
é uma entrega de produção pendente.
