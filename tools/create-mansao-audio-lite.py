"""Original deterministic 96 BPM mansion score and restrained ambience; stdlib/FFmpeg."""
from pathlib import Path
from array import array
import math, random, subprocess, shutil, json, os, hashlib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'production/stages/mansao/audio'
SR = 22050
BPM = 96
BEAT = 60 / BPM
TAU = 2 * math.pi
RNG = random.Random(2026111705)
FFMPEG = os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg')
if not FFMPEG:
    raise RuntimeError('Set FFMPEG_PATH or install FFmpeg.')


def add(out, samples, start, gain):
    at = round(start * SR)
    for i, x in enumerate(samples):
        out[(at + i) % len(out)] += x * gain


def piano(f, duration):
    result = array('f')
    for i in range(round(duration * SR)):
        t = i / SR
        v = sum(math.sin(TAU * f * ratio * t) * math.exp(-(3 + ratio * 1.3) * t) / ratio ** 1.8 for ratio in [1, 2, 3, 4])
        result.append(v * min(t / .006, 1))
    return result


def strings(f, duration):
    result = array('f')
    for i in range(round(duration * SR)):
        t = i / SR
        phase = TAU * f * t + .08 * math.sin(TAU * 4 * t)
        v = math.sin(phase) + .20 * math.sin(2 * phase) + .10 * math.sin(3 * phase)
        envelope = min(t / .13, 1, (duration - t) / .22) * math.exp(-.65 * t)
        result.append(v * max(0, envelope))
    return result


def bass(f, duration=.50):
    return array('f', ((math.sin(TAU * f * i / SR) + .12 * math.sin(TAU * 2 * f * i / SR)) * min(i / (SR * .012), 1) * math.exp(-7 * i / SR) for i in range(round(duration * SR))))


def kick():
    return array('f', (math.sin(TAU * (44 * i / SR + 1.8 * (1 - math.exp(-30 * i / SR)))) * math.exp(-19 * i / SR) for i in range(round(.28 * SR))))


def brushed_snare():
    result = array('f'); previous = 0
    for i in range(round(.13 * SR)):
        v = RNG.uniform(-1, 1)
        result.append((v - previous) * .5 * math.exp(-35 * i / SR)); previous = v
    return result


def score(bars, intro=False):
    out = array('f', [0]) * round(bars * 4 * BEAT * SR)
    roots = [65.406, 61.735, 58.270, 65.406]
    for bar in range(bars):
        at = bar * 4 * BEAT; root = roots[bar % 4]
        for beat in [0, 2.5]:
            add(out, kick(), at + beat * BEAT, .15)
        for beat in [1, 3]:
            add(out, brushed_snare(), at + beat * BEAT, .042)
        for beat, ratio in [(0, 1), (1.75, 1), (2.5, .75)]:
            add(out, bass(root * ratio), at + beat * BEAT, .105)
        for ratio in [2, 2.375, 3]:
            add(out, strings(root * ratio, 2.55), at, .010 if intro else .015)
        # Newly composed, spacious minor-key piano motif; no quoted melodies.
        notes = [(0, 4), (1.5, 4.75), (2.75, 3.5)] if bar % 2 == 0 else [(.5, 4.5), (2, 4), (3.25, 3)]
        for beat, ratio in notes:
            add(out, piano(root * ratio, .85), at + beat * BEAT, .036 if intro else .050)
        if not intro:
            for beat, ratio in [(.75, 2.375), (3.5, 3)]:
                add(out, piano(root * ratio, .6), at + beat * BEAT, .024)
    return out


def room(seconds):
    out = array('f'); low = 0
    for i in range(round(seconds * SR)):
        t = i / SR; low = .986 * low + .014 * RNG.uniform(-1, 1)
        out.append(.035 * low + .0012 * math.sin(TAU * 56 * t))
    return out


def garden_wind(seconds):
    out = array('f'); low = 0
    for i in range(round(seconds * SR)):
        t = i / SR; low = .97 * low + .03 * RNG.uniform(-1, 1)
        envelope = .55 + .25 * math.sin(TAU * t / seconds) + .12 * math.sin(TAU * 3 * t / seconds)
        out.append(.045 * low * envelope)
    return out


def clock(seconds):
    out = array('f', [0]) * round(seconds * SR)
    for tick in range(seconds):
        f = 1180 if tick % 2 == 0 else 940
        click = array('f', ((math.sin(TAU * f * i / SR) + .25 * RNG.uniform(-1, 1)) * math.exp(-240 * i / SR) for i in range(round(.035 * SR))))
        add(out, click, tick + .25, .006)
    return out


def crystals(seconds):
    out = array('f', [0]) * round(seconds * SR)
    for start, f in [(2.2, 1396.913), (2.65, 1661.219), (8.3, 1567.982), (12.7, 1864.655)]:
        chime = array('f', (sum(math.sin(TAU * f * ratio * i / SR) * math.exp(-(5 + ratio) * i / SR) / ratio ** 2 for ratio in [1, 1.43, 2.76]) * min(i / (SR * .012), 1) for i in range(round(.8 * SR))))
        add(out, chime, start, .004)
    return out


def soften_boundary(samples):
    n = round(.004 * SR)
    for i in range(n):
        gain = math.sin((i / (n - 1)) * math.pi / 2) ** 2
        samples[i] *= gain
        samples[-1 - i] *= gain


def stats(samples):
    return {'peak': max(abs(x) for x in samples), 'rms': math.sqrt(sum(x * x for x in samples) / len(samples))}


def decoded_stats(path):
    raw = subprocess.run([FFMPEG, '-v', 'error', '-i', str(path), '-f', 'f32le', '-ar', '44100', '-ac', '1', 'pipe:1'], stdout=subprocess.PIPE, check=True).stdout
    samples = array('f'); samples.frombytes(raw)
    return {**stats(samples), 'seconds': len(samples) / 44100, 'decodedBoundaryJump': abs(samples[0] - samples[-1])}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    builders = [('trilha-intro', lambda: score(2, True)), ('trilha-loop', lambda: score(16)), ('ambiente-sala', lambda: room(16)), ('vento-jardim', lambda: garden_wind(16)), ('relogio', lambda: clock(16)), ('cristais', lambda: crystals(16))]
    report = {}
    for name, builder in builders:
        samples = builder(); soften_boundary(samples); source = stats(samples)
        target = OUT / (name + '.ogg')
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', '-ar', '44100', '-ac', '2', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', '-c:a', 'libvorbis', '-q:a', '5', str(target)], input=samples.tobytes(), check=True)
        report[name] = {'file': 'audio/' + name + '.ogg', 'sampleRate': 44100, 'channels': 2, 'sourceRate': SR, **decoded_stats(target), 'sourcePeak': source['peak'], 'sourceRms': source['rms'], 'loop': name != 'trilha-intro', 'origin': 'original deterministic Python synthesis; no recordings, samples, speech or quoted melodies', 'license': 'MIT, same as the project; original procedural composition and sound design', 'bpm': BPM if name.startswith('trilha') else None, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
        print(name, round(report[name]['seconds'], 3), 'peak', round(report[name]['peak'], 4), flush=True)
    report['_generation_note'] = 'Six original synthetic files, seed2026111705. Intro2bars/loop16bars at96BPM. Synthesized piano/string/bass chase tension, restrained room tone, garden wind, clock and chandelier crystals. Note tails wrap;4ms endpoint envelopes. Complete OGG decoding validates peak/RMS/duration/boundary. No external sources, voices or quoted music; MIT project license.'
    (OUT / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
