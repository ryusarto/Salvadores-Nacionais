#!/usr/bin/env python3
"""Validate arena 3 against PLANO.json, exports, PNG masters and provenance."""
from pathlib import Path
from PIL import Image
import hashlib
import json
import subprocess
import os
import shutil
import struct
import math
import sys
from array import array

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / 'production/stages/banheiros'

def require(ok, message):
    if not ok:
        raise ValueError(message)

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def png(path, label):
    require(path.is_file(), f'{label}: missing PNG master {path}')
    with Image.open(path) as im:
        require(im.format == 'PNG', f'{label}: master is not PNG')
        im.load()
        return im.convert('RGBA')

def vorbis_metadata(path):
    """Read the identification packet and final PCM granule of one Ogg stream."""
    data = path.read_bytes()
    offset = 0
    packet = bytearray()
    identification = None
    serial = None
    sequence = 0
    last_granule = None
    eos = False
    while offset < len(data):
        require(offset+27 <= len(data) and data[offset:offset+4] == b'OggS', f'{path.name}: invalid/truncated Ogg page')
        require(data[offset+4] == 0 and not eos, f'{path.name}: unsupported Ogg version/chained stream')
        flags = data[offset+5]
        granule, page_serial, page_sequence = struct.unpack_from('<QII', data, offset+6)
        if serial is None:
            serial = page_serial
            require(flags & 2 and not flags & 1, f'{path.name}: missing beginning of stream')
        require(page_serial == serial and page_sequence == sequence, f'{path.name}: discontinuous Ogg stream')
        require(bool(flags & 1) == bool(packet), f'{path.name}: invalid packet continuation')
        sequence += 1
        count = data[offset+26]
        require(offset+27+count <= len(data), f'{path.name}: truncated Ogg lacing')
        lacing = data[offset+27:offset+27+count]
        body = offset+27+count
        require(body+sum(lacing) <= len(data), f'{path.name}: truncated Ogg body')
        for length in lacing:
            packet.extend(data[body:body+length])
            body += length
            if length < 255:
                if identification is None:
                    require(len(packet) == 30 and packet[:7] == b'\x01vorbis', f'{path.name}: missing Vorbis identification header')
                    version = struct.unpack_from('<I',packet,7)[0]
                    channels = packet[11]
                    rate = struct.unpack_from('<I',packet,12)[0]
                    require(version == 0 and channels > 0 and rate > 0 and packet[29] & 1, f'{path.name}: invalid Vorbis identification header')
                    identification = dict(codec='vorbis',channels=channels,sampleRate=rate)
                packet.clear()
        if granule != (1 << 64)-1:
            require(last_granule is None or granule >= last_granule, f'{path.name}: backwards Ogg granule')
            last_granule = granule
        eos = bool(flags & 4)
        offset = body
    require(eos and not packet and identification and last_granule and last_granule > 0, f'{path.name}: incomplete Ogg stream')
    return dict(**identification,seconds=last_granule/identification['sampleRate'],samples=last_granule)

def decode_audio(path, metadata):
    """Decode to PCM in memory; no ffprobe or temporary media files required."""
    executable = os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg')
    require(executable, 'Set FFMPEG_PATH or install ffmpeg to validate actual audio decoding')
    decoded = subprocess.run([executable,'-v','error','-nostdin','-i',str(path),'-map','0:a:0','-f','f32le','-acodec','pcm_f32le','pipe:1'],check=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    require(not decoded.stderr.strip(), f'{path.name}: decoder errors: {decoded.stderr.decode(errors="replace")}')
    require(len(decoded.stdout) % (4*metadata['channels']) == 0, f'{path.name}: incomplete PCM output')
    samples = array('f')
    samples.frombytes(decoded.stdout)
    if sys.byteorder != 'little':
        samples.byteswap()
    require(samples and all(math.isfinite(v) for v in samples), f'{path.name}: invalid PCM samples')
    peak = max(abs(v) for v in samples)
    rms = math.sqrt(sum(v*v for v in samples)/len(samples))
    seconds = len(samples)/metadata['channels']/metadata['sampleRate']
    require(abs(seconds-metadata['seconds']) < .1 and 0 < rms <= peak < 1, f'{path.name}: decoded duration/levels invalid')
    return dict(seconds=seconds,peak=peak,rms=rms)

def main():
    plan = json.loads((PACK / 'PLANO.json').read_text())
    m = json.loads((PACK / 'manifest.json').read_text())
    prompts = json.loads((PACK / 'source/prompts-completos.json').read_text())
    old = json.loads((PACK.parent / 'palco/manifest.json').read_text())
    groups = {g['slug'] + (f'-{n}' if g['variants'] > 1 else ''): g
              for g in plan['groups'] for n in range(1, g['variants'] + 1)}
    expected = set(groups)
    planned_files = sum(g['variants'] for g in plan['groups'])
    planned_strips = sum(g['variants'] for g in plan['groups'] if g['framesPerVariant'] > 1)
    planned_frames = sum(g['variants']*g['framesPerVariant'] for g in plan['groups'] if g['framesPerVariant'] > 1)
    require(len(expected) == planned_files, 'duplicate asset IDs in plan')
    require(len(plan['groups']) == plan['summary']['groups'] == m['groups'], 'group inventory differs')
    require(planned_files == plan['summary']['runtimeFiles'], 'runtime inventory differs')
    require((planned_strips,planned_frames) == (plan['summary']['animatedStrips'],plan['summary']['animationFrames']), 'planned animation inventory differs')
    require(set(m['assets']) == expected, f'asset mismatch: missing={expected-set(m["assets"])} extra={set(m["assets"])-expected}')
    require(not m['missing'], f'undelivered assets: {m["missing"]}')
    strips = frames = decoded = masters = reused = 0
    for key, a in m['assets'].items():
        p = PACK / a['path']
        require(p.is_file(), f'{key}: missing export')
        require(p.stat().st_size == a['bytes'] and digest(p) == a['sha256'], f'{key}: bytes/hash mismatch')
        g = groups[key]
        require(a['frames'] == g['framesPerVariant'], f'{key}: frame contract mismatch')
        if a['kind'] == 'audio':
            continue
        with Image.open(p) as im:
            im.load()
            require(im.size == (a['width'], a['height']), f'{key}: dimensions mismatch')
            require(('A' in im.getbands()) == a['alpha'], f'{key}: alpha metadata mismatch')
            decoded += im.width * im.height * 4
            if a['frames'] == 6:
                strips += 1
                frames += 6
                require(im.size == (3000, 500) and a.get('cellWidth') == 500 and a.get('cellHeight') == 500, f'{key}: strip layout')
                require('A' in im.getbands(), f'{key}: no alpha channel')
                x, y, w, h = a['crop']
                require(x >= 0 and y >= 0 and w > 0 and h > 0 and x+w <= 500 and y+h <= 500, f'{key}: invalid shared crop')
                hashes = set()
                for i in range(6):
                    cell = im.crop((i*500, 0, (i+1)*500, 500)).convert('RGBA')
                    alpha = cell.getchannel('A')
                    require(alpha.getextrema()[0] == 0 and alpha.getextrema()[1] > 12, f'{key}: empty/opaque frame {i}')
                    bounds = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
                    require(bounds and bounds[0] >= max(0,x-2) and bounds[1] >= max(0,y-2) and bounds[2] <= min(500,x+w+2) and bounds[3] <= min(500,y+h+2), f'{key}: crop cuts frame {i}')
                    hashes.add(hashlib.sha256(cell.tobytes()).hexdigest())
                require(len(hashes) == 6, f'{key}: duplicate runtime frames')
            elif g['origin'] == 'generated':
                require('A' in im.getbands() and im.getchannel('A').getextrema()[0] == 0, f'{key}: missing real transparency')
        if g['origin'] == 'generated':
            src = PACK / a['source']
            master = png(src, key)
            require(master.getchannel('A').getextrema()[0] == 0, f'{key}: opaque master')
            entry = next((v for v in prompts.values() if isinstance(v,dict) and v.get('source') == a['source']), prompts.get(key, {}))
            require(entry.get('prompt') and entry.get('transparent_background') is True, f'{key}: missing generation prompt/alpha contract')
            require(entry.get('sha256') == digest(src), f'{key}: master prompt hash mismatch')
            if a['frames'] == 6:
                sheet = png(PACK / 'source/pranchas' / f'{key}.png', key)
                require(sheet.size == (1500,1000), f'{key}: contact sheet layout')
                require(len(a.get('frameHashes',[])) == 6 and len(set(a['frameHashes'])) == 6, f'{key}: missing source frame hashes')
                for n in range(6):
                    cell = sheet.crop((n%3*500,n//3*500,(n%3+1)*500,(n//3+1)*500))
                    require(hashlib.sha256(cell.tobytes()).hexdigest() == a['frameHashes'][n], f'{key}: source frame {n} mismatch')
            masters += 1
        elif g['origin'] == 'reused-palco':
            source = old['assets'][g['sourceAsset']]
            require(a.get('origin') == 'reused-palco' and a.get('sourceManifest') == '../palco/manifest.json', f'{key}: missing reuse provenance')
            require(a['sha256'] == source['sha256'] == digest(PACK.parent / 'palco' / source['path']), f'{key}: reused asset differs')
            reused += 1
        # Optional lossless PNG exports of every raster delivery, if exported.
        png_export = PACK / 'source/png-runtime' / Path(a['path']).with_suffix('.png')
        if png_export.exists():
            require(png(png_export,key).size == (a['width'],a['height']), f'{key}: runtime PNG dimensions')
            with Image.open(p) as webp:
                require(png(png_export,key).tobytes() == webp.convert('RGBA').tobytes(), f'{key}: runtime PNG differs from WebP')
    refs = m['layers'] + m['objects'] + m.get('foreground',[]) + m.get('alternatives',[])
    for o in refs:
        require(o['asset'] in expected, f'unknown placement: {o}')
    require(set(m['interactive']) == {'cabine-fiscal','cerca-fiscal','carimbo-fiscal'}, 'interactive contract')
    require(not any(o['asset'] in {'cabine-fiscal','cerca-fiscal'} for o in refs), 'gameplay barriers painted in decoration')
    require(set(m['essential']) <= expected, 'unknown essential asset')
    require(m['ground']['asset'] in expected, 'unknown ground asset')
    for name, entry in prompts.items():
        if isinstance(entry,dict) and entry.get('status') == 'generated':
            source = PACK / entry['source']
            png(source,name)
            require(entry.get('sha256') == digest(source), f'{name}: retained master hash mismatch')
    require(m['world'] == dict(width=2600,height=1080,viewWidth=1920,cameraMax=680,feetY=930,groundTopY=826), 'world coordinates differ')
    require((strips,frames) == (planned_strips,planned_frames), 'animation inventory differs')
    audio = json.loads((PACK / 'audio/manifest.json').read_text())
    audio_keys = {k for k,a in m['assets'].items() if a['kind']=='audio'}
    planned_audio = {key for key,g in groups.items() if g['folder'] == 'audio'}
    require(audio_keys == planned_audio == {k for k in audio if not k.startswith('_')}, 'audio inventory differs')
    for key in audio_keys:
        a = audio[key]
        p = PACK / a['file']
        require(digest(p) == a['sha256'], f'{key}: audio provenance hash')
        metadata = vorbis_metadata(p)
        require(metadata['sampleRate']==a['sampleRate']==44100 and metadata['channels']==a['channels']==2, f'{key}: audio format')
        require(abs(metadata['seconds']-a['seconds']) < .1, f'{key}: audio duration')
        decode_audio(p, metadata)
        require(0 < a['rms'] <= a['peak'] < 1 and a.get('origin'), f'{key}: audio measurements/provenance')
        if a.get('sourceFile'):
            require(digest(ROOT / a['sourceFile']) == digest(p), f'{key}: reused audio differs')
    report = dict(groups=len(plan['groups']),assets=len(expected),animatedStrips=strips,animationFrames=frames,audios=len(audio_keys),generatedPNGMasters=masters,reusedImages=reused,runtimeBytes=sum(a['bytes'] for a in m['assets'].values()),decodedRGBABytesEstimate=decoded,hashes='pass',dimensions='pass',alphaAndFrames='pass',provenance='pass',oggMetadataAndPCMDecode='pass',missing=m['missing'])
    (ROOT/'production/qa/banheiros-validation.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))

if __name__ == '__main__':
    main()
