# Cenário 07 — Inferno do Djabo

Revisão visual 2: coro de três esqueletos e oito grupos adicionais de chamas ambientais na lava distante. Arena modular em `production/stages/inferno/`, com 13 imagens/tiras originais, quatro loops/24 quadros ambientais, seis áudios e apresentação derivada da montagem. O [contrato e a reprodução](../production/stages/inferno/README.md) descrevem fontes, apoios, exportação e limites.

O piso de basalto não contém fogo, lava ou zona segura pintados. Lava e braseiros decorativos ficam atrás/acima da área de combate; ataques, aviso e trecho seguro de 360px continuam no renderer/core reais. Os grupos adicionais usam apoio `background-lava-surface`, parallax 0,2 e base y=805; os braseiros mantêm apoio `brazier-bowl`. Correntes mantêm fixação no teto; o trono se apoia no patamar superior da escadaria.

Manifesto/inventário: `production/stages/inferno/manifest.json` e `PLANO.json`. Galeria vinculada: `production/qa/inferno-cenario.html`. Versão autossuficiente: `production/qa/inferno-cenario-offline.html`. Integridade/crops/apoios: `production/qa/inferno-validation.json`; combate, transformação e limites da aprovação independente estão em `production/qa/inferno-review-v2/final-review.json`.

Revisão visual 2 aprovada no escopo de `production/qa/inferno-review-v2/final-review.json`: seis poses dos esqueletos, fogo ampliado, câmeras/controles da prévia e smoke do Inferno Nacional. As evidências amplas de core/renderer da revisão original foram reaproveitadas por hashes idênticos; não foram executadas novamente nesta troca de arte.
