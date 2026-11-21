"""Original deterministic 108 BPM finale and deep cavern ambience; stdlib/FFmpeg."""
from pathlib import Path
from array import array
import math, random, subprocess, shutil, json, os, hashlib
from functools import lru_cache

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'production/stages/inferno/audio'
SR = 22050
BPM = 108
BEAT = 60 / BPM
TAU = 2 * math.pi
RNG = random.Random(2026112007)
FFMPEG = os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg')
if not FFMPEG:
    raise RuntimeError('Set FFMPEG_PATH or install FFmpeg.')


def add(out, samples, start, gain):
    at = round(start * SR)
    for i, x in enumerate(samples):
        out[(at + i) % len(out)] += x * gain


@lru_cache(maxsize=None)
def choir(f, duration=2.5):
    # Additive formants evoke a wordless synthetic choir; no voice recordings or phonemes.
    partials = [(n, .28 / n + .7 * math.exp(-((n * f - 680) / 240) ** 2) / n ** .5 + .35 * math.exp(-((n * f - 1180) / 350) ** 2) / n ** .5) for n in range(1, 15)]
    norm = sum(weight for _, weight in partials)
    result = array('f')
    for i in range(round(duration * SR)):
        t = i / SR; phase = TAU * f * t + .06 * math.sin(TAU * 4 * t)
        v = sum(math.sin(phase * n) * weight for n, weight in partials) / norm
        envelope = min(t / .16, 1, (duration - t) / .24) * math.exp(-.45 * t)
        result.append(v * max(0, envelope))
    return result


def bass(f, duration=.40):
    return array('f', ((math.sin(TAU * f * i / SR) + .14 * math.sin(TAU * 2 * f * i / SR)) * min(i / (SR * .01), 1) * math.exp(-8 * i / SR) for i in range(round(duration * SR))))


def bell(f, duration=.40):
    return array('f', ((math.sin(TAU * f * i / SR) + .12 * math.sin(TAU * f * 2.37 * i / SR)) * min(i / (SR * .008), 1) * math.exp(-12 * i / SR) for i in range(round(duration * SR))))


def kick():
    return array('f', (math.sin(TAU * (43 * i / SR + 2.3 * (1 - math.exp(-30 * i / SR)))) * math.exp(-17 * i / SR) for i in range(round(.33 * SR))))


def percussion():
    return array('f', ((.55 * math.sin(TAU * (132 * i / SR - 40 * (i / SR) ** 2)) + .35 * RNG.uniform(-1, 1)) * math.exp(-28 * i / SR) for i in range(round(.18 * SR))))


def score(bars, intro=False):
    out = array('f', [0]) * round(bars * 4 * BEAT * SR)
    roots = [55.0, 51.913, 48.999, 55.0]
    for bar in range(bars):
        at = bar * 4 * BEAT; root = roots[bar % 4]
        for beat in [0, 1.75, 2.5, 3.5]:
            add(out, kick(), at + beat * BEAT, .21)
        for beat in [1, 3]:
            add(out, percussion(), at + beat * BEAT, .075 if intro else .10)
        for beat, ratio in [(0, 1), (.75, 1.5), (1.5, 1), (2.75, .75), (3.5, 1)]:
            add(out, bass(root * ratio), at + beat * BEAT, .15)
        for ratio in [2, 2.375, 3]:
            add(out, choir(root * ratio), at, .025 if intro else .038)
        if not intro:
            motif = [(.5, 8), (2.25, 7.5), (3.25, 6)] if bar % 2 == 0 else [(1.25, 6), (2.75, 5), (3.5, 4.75)]
            for beat, ratio in motif:
                add(out, bell(root * ratio, .27), at + beat * BEAT, .025)
    return out


def cavern(seconds, style):
    out = array('f'); low = 0; deep = 0
    for i in range(round(seconds * SR)):
        t = i / SR; v = RNG.uniform(-1, 1)
        low = .985 * low + .015 * v; deep = .997 * deep + .003 * v
        envelope = .58 + .25 * math.sin(TAU * t / seconds) + .10 * math.sin(TAU * 3 * t / seconds)
        if style == 'caverna':
            sound = .028 * low + .0025 * math.sin(TAU * 49 * t) + .0011 * math.sin(TAU * 98 * t)
        else:
            sound = (.065 * low + .04 * deep) * envelope
        out.append(sound)
    return out


def lava():
    out = array('f', [0]) * (16 * SR); low = 0
    for i in range(len(out)):
        low = .94 * low + .06 * RNG.uniform(-1, 1)
        out[i] = .017 * low
    for _ in range(24):
        f = RNG.uniform(75, 145)
        bubble = array('f', (math.sin(TAU * (f * i / SR - 35 * (i / SR) ** 2)) * min(i / (SR * .02), 1) * math.exp(-18 * i / SR) for i in range(round(.27 * SR))))
        add(out, bubble, RNG.uniform(0, 16), .007)
    return out


def chains():
    out = array('f', [0]) * (16 * SR)
    for start, f in [(1.7, 310), (5.6, 270), (8.8, 350), (12.1, 295), (14.4, 330)]:
        hit = array('f', (sum(math.sin(TAU * f * ratio * i / SR) * math.exp(-(10 + ratio * 4) * i / SR) / ratio ** 1.6 for ratio in [1, 1.41, 2.37, 3.14]) * min(i / (SR * .006), 1) for i in range(round(.5 * SR))))
        add(out, hit, start, .005)
        add(out, hit, start + .19, .0018)
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
    builders = [('trilha-intro', lambda: score(2, True)), ('trilha-loop', lambda: score(16)), ('ambiente-caverna', lambda: cavern(16, 'caverna')), ('vento-profundo', lambda: cavern(16, 'vento')), ('lava-distante', lava), ('correntes', chains)]
    report = {}
    for name, builder in builders:
        samples = builder(); soften_boundary(samples); source = stats(samples)
        target = OUT / (name + '.ogg')
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', '-ar', '44100', '-ac', '2', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', '-c:a', 'libvorbis', '-q:a', '5', str(target)], input=samples.tobytes(), check=True)
        report[name] = {'file': 'audio/' + name + '.ogg', 'sampleRate': 44100, 'channels': 2, 'sourceRate': SR, **decoded_stats(target), 'sourcePeak': source['peak'], 'sourceRms': source['rms'], 'loop': name != 'trilha-intro', 'origin': 'original deterministic Python synthesis; no recordings, samples, speech or quoted melodies', 'license': 'MIT, same as the project; original procedural composition and sound design', 'bpm': BPM if name.startswith('trilha') else None, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
        print(name, round(report[name]['seconds'], 3), 'peak', round(report[name]['peak'], 4), flush=True)
    report['_generation_note'] = 'Six original synthetic files, seed2026112007. Intro2bars/loop16bars at108BPM. Additive wordless choir-like synth, percussive bass and drums; cavern air, deep wind, distant lava and sparse metal chains. No voice recording, phonemes, intelligible words, samples or musical quotations. Note tails wrap;4ms endpoint envelopes. Full OGG decoding validates peak/RMS/duration/boundary. MIT project license.'
    (OUT / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
