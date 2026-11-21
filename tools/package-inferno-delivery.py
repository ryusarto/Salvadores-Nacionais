#!/usr/bin/env python3
"""Package the approved Inferno visual revision 2 without bundling the whole game."""
from pathlib import Path
import argparse, json, hashlib, shutil, zipfile, subprocess
ap=argparse.ArgumentParser()
ap.add_argument('--repo',required=True)
ap.add_argument('--dest',required=True)
args=ap.parse_args()
R=Path(args.repo).resolve();D=Path(args.dest).resolve();P=R/'production/stages/inferno'
sha=lambda b:hashlib.sha256(b).hexdigest()
validation=json.loads((R/'production/qa/inferno-validation.json').read_text())
assert validation['passed'],validation['errors']
review=json.loads((R/'production/qa/inferno-review-v2/final-review.json').read_text())
assert review['passed'],review
build=json.loads((R/'production/qa/inferno-build.json').read_text())
assert sha((R/'dist/salvadores-nacionais.html').read_bytes())==build['htmlSHA256']
assert review.get('buildSHA256',build['htmlSHA256'])==build['htmlSHA256']
manifest=json.loads((P/'manifest.json').read_text())
assert not manifest['missing'] and manifest['version']==2
assert sha((P/'manifest.json').read_bytes())==build['manifestSHA256']
assert manifest['assets']['almas-coro']['source'].endswith('esqueletos-coro.png')
for a in manifest['assets'].values():assert sha((P/a['path']).read_bytes())==a['sha256']
D.mkdir(parents=True,exist_ok=True)
copies={'PREVIA_CENARIO_07.html':R/'production/qa/inferno-cenario-offline.html','CENARIO_07_INFERNO.png':P/'source/composicao.png','PROMPTS_COMPLETOS.json':P/'source/prompts-completos.json','REVISAO.json':R/'production/qa/inferno-review-v2/final-review.json','PLANO_CENARIO_07.json':P/'PLANO.json'}
for name,source in copies.items():shutil.copy2(source,D/name)
for f in (P/'source/generated').glob('*.png'):
 dest=D/'source/generated'/f.name;dest.parent.mkdir(parents=True,exist_ok=True)
 if dest.exists():assert dest.read_bytes()==f.read_bytes(),f.name
 else:shutil.copy2(f,dest)
shutil.copy2(P/'source/prompts-completos.json',D/'source/prompts-completos.json')
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip()
readme="""SALVADORES NACIONAIS — CENÁRIO 07: INFERNO / DJABO — REVISÃO 2

Os três NPCs do coro foram transformados em esqueletos completos nas seis poses. O novo mestre foi editado com ImageGen integrado. As fontes humanas anteriores ficam apenas como histórico, sem uso no coro atual.

O ambiente recebeu oito grupos adicionais de chamas sobre a lava distante, com tamanhos/fases variados, e fogo maior nos dois braseiros. Todo o fogo novo fica atrás do piso de combate. O trecho seguro e as regras/renderer do ataque permanecem os aprovados na versão anterior.

Abra PREVIA_CENARIO_07.html diretamente no navegador. A prévia é autossuficiente e contém câmera, pausa/avanço, efeitos reduzidos, galeria/download por peça e seis áudios ativados pelo usuário. A demonstração do Inferno Nacional usa geometria real, sem simular dano.

Continuam 22 assets separados: 13 imagens/tiras geradas selecionadas, um título em Bangers, seis áudios originais e duas apresentações derivadas da montagem. Quatro tiras somam 24 quadros ambientais. As chamas extras reutilizam a tira ambiental existente. PNGs mestres, variantes históricas e prompts completos foram preservados no ZIP e na pasta source/.

ENTREGA_CENARIO_07.zip conserva caminhos do projeto: pack completo, fontes/licença, código relevante, ferramentas, documentação, testes e evidências. A prévia funciona offline; este ZIP não é uma distribuição offline do jogo inteiro. Para reproduzir a build, use o repositório completo e o comando registrado em production/qa/inferno-build.json.

Esta revisão visual tem evidência nova em production/qa/inferno-review-v2. Testes anteriores de core/renderer sem alterações são reaproveitados explicitamente; não são apresentados como repetidos. Os detalhes e limites estão em REVISAO.json. Sem playtest humano ou aparelho físico.

A build local parte da referência Washington 2d7f197 com índice oficial de 26 pacotes/722 tiras de personagens. Alterações posteriores de menu/Pai do Fujão da main não estão integradas. O problema separado do índice da main segue registrado para a revisão geral. A entrega anterior permanece na pasta cenario-07-inferno-v1. Esta revisão foi salva localmente e ainda não foi enviada ao GitHub.

Para recriar o pacote após a revisão e o commit, execute:
python3 tools/package-inferno-delivery.py --repo CAMINHO_DO_REPOSITORIO --dest PASTA_DA_ENTREGA_V2
"""
(D/'LEIA-ME.txt').write_text(readme)
paths=[f for f in P.rglob('*') if f.is_file()]
paths.extend(R/'tools'/n for n in ['build-inferno-preview.mjs','capture-inferno-ui.mjs','create-inferno-audio-lite.py','export-inferno.py','finalize-inferno.mjs','validate-inferno.mjs','build-stage-release.mjs','package-inferno-delivery.py'])
paths.extend(R/n for n in ['src/render/boss-art.js','src/render/inferno-stage.js','src/render/stage-packs.js','src/data/characters/djabo.js','tests/browser/inferno-floor-fire.mjs','docs/CENARIO-07-INFERNO.md','docs/PRODUCAO-ARTE.md','docs/MODO-HISTORIA.md','dist/salvadores-nacionais.html'])
paths.extend(f for f in (R/'production/qa').glob('inferno-*') if f.is_file())
paths.extend(f for f in (R/'production/qa/inferno-review-v2').rglob('*') if f.is_file())
paths.extend((R/'production/qa/inferno-review').glob('*.json'))
paths.append(R/'production/qa/main-sprite-index-review.json')
assert all(f.exists() for f in paths)
archive=D/'ENTREGA_CENARIO_07.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for f in sorted(set(paths)):z.write(f,f.relative_to(R).as_posix())
 z.write(D/'LEIA-ME.txt','LEIA-ME-CENARIO-07.txt')
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 count=len(z.infolist())
result=dict(stage='inferno',chapter=7,revision=2,boss='djabo',status='produzido e revisado',commit=commit,assets=len(manifest['assets']),generatedMasters=validation['generatedMasters'],animationStrips=4,environmentFrames=24,audioFiles=6,decorativeFireGroups=len([o for o in manifest['objects'] if o['asset']=='fogo-braseiro']),zipFiles=count,zipBytes=archive.stat().st_size,zipSHA256=sha(archive.read_bytes()),zipCRC='passed',generator='built-in ImageGen; original PNGs, historical variants and full prompts retained',github='not submitted',buildSHA256=build['htmlSHA256'],manifestSHA256=build['manifestSHA256'],files={n:sha((D/n).read_bytes()) for n in copies})
(D/'ENTREGA.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps(result,ensure_ascii=False))
