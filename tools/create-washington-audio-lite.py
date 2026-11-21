"""Original deterministic 116 BPM Washington score and park ambience; stdlib/FFmpeg."""
from pathlib import Path
from array import array
import math, random, subprocess, shutil, json, os, hashlib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'production/stages/washington/audio'
SR = 22050
BPM = 116
BEAT = 60 / BPM
TAU = 2 * math.pi
RNG = random.Random(2026111806)
FFMPEG = os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg')
if not FFMPEG:
    raise RuntimeError('Set FFMPEG_PATH or install FFmpeg.')


def add(out, samples, start, gain):
    at = round(start * SR)
    for i, x in enumerate(samples):
        out[(at + i) % len(out)] += x * gain


def tone(f, duration, decay=8, harmonics=False):
    result = array('f')
    for i in range(round(duration * SR)):
        t = i / SR
        v = math.sin(TAU * f * t) + .12 * math.sin(TAU * 2 * f * t)
        if harmonics:
            v += .10 * math.sin(TAU * 3 * f * t)
        result.append(v * min(t / .008, 1) * math.exp(-decay * t))
    return result


def kick():
    return array('f', (math.sin(TAU * (47 * i / SR + 2.1 * (1 - math.exp(-32 * i / SR)))) * math.exp(-18 * i / SR) for i in range(round(.30 * SR))))


def snare():
    return array('f', ((RNG.uniform(-1, 1) * .6 + .25 * math.sin(TAU * 168 * i / SR)) * math.exp(-33 * i / SR) for i in range(round(.16 * SR))))


def hat():
    result = array('f'); previous = 0
    for i in range(round(.045 * SR)):
        v = RNG.uniform(-1, 1)
        result.append((v - previous) * math.exp(-95 * i / SR)); previous = v
    return result


def score(bars, intro=False):
    out = array('f', [0]) * round(bars * 4 * BEAT * SR)
    roots = [77.782, 69.296, 65.406, 73.416]
    for bar in range(bars):
        at = bar * 4 * BEAT; root = roots[bar % 4]
        for beat in [0, 1.5, 2.75]:
            add(out, kick(), at + beat * BEAT, .20)
        for beat in [1, 3]:
            add(out, snare(), at + beat * BEAT, .085 if intro else .11)
        for eighth in range(8):
            add(out, hat(), at + (eighth * .5 + (.035 if eighth % 2 else 0)) * BEAT, .023)
        for beat, ratio in [(0, 1), (.75, 1), (2, .75), (3.25, 1.5)]:
            add(out, tone(root * ratio, .36, 8), at + beat * BEAT, .14)
        # Newly composed syncopated brass-like synth; no anthem or musical quotations.
        motif = [(.25, 4), (1.25, 4.5), (2.75, 6)] if bar % 2 == 0 else [(.5, 4.75), (2.25, 4), (3.5, 3.5)]
        for beat, ratio in motif:
            add(out, tone(root * ratio, .24, 11, True), at + beat * BEAT, .024 if intro else .044)
        if not intro:
            for beat in [.75, 2.5]:
                for ratio in [2, 2.375, 3]:
                    add(out, tone(root * ratio, .20, 13), at + beat * BEAT, .019)
    return out


def park_ambience(seconds, style):
    out = array('f'); low = 0; lower = 0
    for i in range(round(seconds * SR)):
        t = i / SR; v = RNG.uniform(-1, 1)
        low = .97 * low + .03 * v
        lower = .994 * lower + .006 * v
        swell = .60 + .23 * math.sin(TAU * t / seconds) + .10 * math.sin(TAU * 3 * t / seconds)
        if style == 'gramado':
            sound = .025 * low + .004 * lower
        elif style == 'vento':
            sound = .06 * low * swell
        else:
            # Low-level unvoiced crowd texture, not speech or a recorded crowd.
            chatter = .55 + .20 * math.sin(TAU * .25 * t) + .13 * math.sin(TAU * .4375 * t)
            sound = (.030 * (low - lower) + .0016 * math.sin(TAU * 190 * t)) * chatter
        out.append(sound)
    return out


def fountain():
    out = array('f'); previous = 0; low = 0
    for i in range(16 * SR):
        t = i / SR; v = RNG.uniform(-1, 1); low = .90 * low + .10 * v
        envelope = .70 + .12 * math.sin(TAU * t / 8)
        out.append(((v - previous) * .006 + low * .018) * envelope)
        previous = v
    for _ in range(26):
        f = RNG.uniform(920, 1550)
        drop = array('f', (math.sin(TAU * (f * i / SR - 150 * (i / SR) ** 2)) * math.exp(-45 * i / SR) for i in range(round(.10 * SR))))
        add(out, drop, RNG.uniform(0, 16), .004)
    return out


def soften_boundary(samples):
    # Four-millisecond envelopes give both PCM endpoints zero amplitude; no click at wrap.
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
    builders = [('trilha-intro', lambda: score(2, True)), ('trilha-loop', lambda: score(16)), ('ambiente-gramado', lambda: park_ambience(16, 'gramado')), ('vento', lambda: park_ambience(16, 'vento')), ('agua-chafariz', fountain), ('publico', lambda: park_ambience(16, 'publico'))]
    report = {}
    for name, builder in builders:
        samples = builder(); soften_boundary(samples); source = stats(samples)
        target = OUT / (name + '.ogg')
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', '-ar', '44100', '-ac', '2', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact', '-c:a', 'libvorbis', '-q:a', '5', str(target)], input=samples.tobytes(), check=True)
        report[name] = {'file': 'audio/' + name + '.ogg', 'sampleRate': 44100, 'channels': 2, 'sourceRate': SR, **decoded_stats(target), 'sourcePeak': source['peak'], 'sourceRms': source['rms'], 'loop': name != 'trilha-intro', 'origin': 'original deterministic Python synthesis; no recordings, samples, speech or quoted melodies', 'license': 'MIT, same as the project; original procedural composition and sound design', 'bpm': BPM if name.startswith('trilha') else None, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
        print(name, round(report[name]['seconds'], 3), 'peak', round(report[name]['peak'], 4), flush=True)
    report['_generation_note'] = 'Six original synthetic files, seed2026111806. Intro2bars/loop16bars at116BPM. Original brass-like synth/bass/percussion theme without anthem quotations; park wind, fountain and unvoiced crowd textures. Note tails wrap;4ms endpoint envelopes. Full OGG decoding validates peak/RMS/duration/boundary. No recordings, speech, samples or quoted music; MIT project license.'
    (OUT / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
