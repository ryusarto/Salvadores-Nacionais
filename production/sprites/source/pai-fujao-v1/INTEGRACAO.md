# Integração proposta — Pai do Fujão

Esta entrega não aplica mudanças ao repositório oficial. A ficha foi conferida no GitHub em 17/11/2026: src/data/characters/pai-fujao.js, SHA d85482f99e1ac507bc668c3a5751dab66ff23603. Cópias de referência estão em producao/referencia/. Manter os valores de combate existentes; os seis quadros são fases de desenho, não seis frames de lógica.

| Ação | Animação do corpo | Efeitos e encaixe |
|---|---|---|
| Bengalada, 5H | golpe-5H | bengala-arco e impacto. A bengala já faz parte do corpo; não desenhar uma segunda arma. |
| Comando à Distância, 5S | golpe-5S | capanga-correr → capanga-ataque. Criação no frame lógico 16. Telefone pronto/ocupado são objetos de HUD. |
| Peso da Família, 6S | golpe-6S | Contato nos frames lógicos 15–20; impacto separado. |
| Peso da Família turbo | golpe-6S-turbo | Única variante turbo prevista na ficha atual. |
| Recurso Negado, 4S | golpe-4S | Gancho ascendente; contato 7–15. Reutilizar bengala-arco/impacto conforme direção do golpe. |
| Rachadinha, SA1 | golpe-SA1 | dinheiro-girar, dinheiro-impacto e dinheiro-cura. Cinco disparos em 10,14,18,22,26; alternar as poses de emissão e só recuperar depois do último. Cura de 30% conforme regra existente. |
| Prisão Domiciliar Pra Você, SA3 | golpe-SA3 | Contato 13–16: prisao-trava; 30–32: prisao-choque; 48–51: prisao-impacto-final. Índices de desenho 2,3,4 respectivamente (base zero). Prender a tornozeleira do efeito ao tornozelo do oponente; não duplicar a do chefe. |
| Foro Privilegiado | Corpo da ação atual | foro-escudo enquanto ativo; foro-impacto no bloqueio de dano; foro-cassado e foro-retorno nas transições. Centros vazados para preservar a leitura do lutador. |
| Limite da tornozeleira | reacao-tornozeleira | tornozeleira-zona para marcação no chão; tornozeleira-monitor para indicador; tornozeleira-choque ancorado no dispositivo do chefe. |
| Vingança Paterna | furia-paterna | furia-aura como camada separada; pode acompanhar a entrada enfurecida após a derrota do filho na narrativa. |

Os demais golpes normais, aéreos, agarrão e blindado estão no inventário completo de 40 ações. Não existe 2S nesta ficha; não criar um golpe para preencher uma tira inexistente.

## Geometria e escala

Orientação nativa para a direita; espelhamento segue o padrão six-frame. Usar a origem do pé, com a translação aérea e do cenário controlada pelo jogo. O desenho não contém projéteis destacados, adversário, capanga ou energia sobreposta. Dinheiro segurado antes do lançamento é parte da pose; o projétil em voo é separado.

Algumas ações com a bengala ou o corpo muito aberto foram reduzidas como conjunto para caber na célula. perfil-runtime.json registra a compensação por ação; não ampliar somente o quadro do impacto. Corpos compactos permanecem naturalmente menores.

Efeitos genéricos usam centro (250,250); capanga usa apoio no pé (250,456). tornozeleira-zona é uma máscara elíptica: quadros 1–2 seguros, 3–4 aviso, 5–6 violação; selecionar pela condição da mecânica. tornozeleira-monitor segue as mesmas três faixas. Os outros efeitos são sequências temporais, conforme fases em producao/fx-jobs.json.

A posição física do limite continua vindo da ficha (centro STAGE_W/2+260, raio420), não da largura do PNG. Redimensionar a elipse para o espaço de mundo. O monitor visual do chefe permanece preso ao corpo.

## Revisão no jogo ainda necessária

Conferir escala comparada aos demais lutadores, pés no chão, saltos, câmera, poses de acerto nas janelas reais, alfa sobre os cenários, capanga com sua hitbox e super de três impactos sincronizado. A validação de arquivos não substitui essa etapa.
