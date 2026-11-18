"""Original deterministic 112 BPM chase score and quiet airport ambience; stdlib/FFmpeg."""
from pathlib import Path
from array import array
import math, random, subprocess, shutil, json, os, hashlib

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'production/stages/aeroporto/audio'
SR = 22050
BPM = 112
BEAT = 60 / BPM
TAU = 2 * math.pi
RNG = random.Random(2026111704)
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
    roots = [73.416, 73.416, 65.406, 69.296]
    for bar in range(bars):
        at = bar * 4 * BEAT; root = roots[bar % 4]
        for beat in [0, 1.75, 2.5, 3.75]:
            add(out, kick(), at + beat * BEAT, .21)
        for beat in [1, 3]:
            add(out, snare(), at + beat * BEAT, .09 if intro else .12)
        for eighth in range(8):
            add(out, hat(), at + (eighth * .5 + (.025 if eighth % 2 else 0)) * BEAT, .022)
        for beat, ratio in [(0, 1), (.75, 1), (1.5, .75), (2.25, 1), (3.25, 1.5)]:
            add(out, tone(root * ratio, .30, 9), at + beat * BEAT, .14)
        if not intro:
            # Short original minor-key ostinato; no samples or melody quotations.
            for beat, ratio in [(0, 4), (.5, 4.75), (1.5, 4.5), (2, 4), (2.75, 6), (3.5, 4.75)]:
                add(out, tone(root * ratio, .20, 16, True), at + beat * BEAT, .034)
            for ratio in [2, 2.375, 3]:
                add(out, tone(root * ratio, .75, 4), at + 2.5 * BEAT, .017)
    return out


def motor_ambience(seconds, style):
    # Low-pass synthetic air and distant motor harmonics; deliberately restrained.
    out = array('f'); low = 0
    for i in range(round(seconds * SR)):
        t = i / SR
        low = .975 * low + .025 * RNG.uniform(-1, 1)
        swell = .65 + .25 * math.sin(TAU * t / seconds)
        if style == 'pista':
            v = .022 * low + .009 * math.sin(TAU * 66 * t) + .004 * math.sin(TAU * 132 * t)
        elif style == 'vento':
            v = .075 * low * swell
        else:
            v = (.013 * math.sin(TAU * 92 * t) + .006 * math.sin(TAU * 184 * t) + .032 * low) * swell
        out.append(v)
    return out


def boarding_chime():
    # Sparse quiet airport chime, decorative ambience rather than a gameplay alarm.
    out = array('f', [0]) * (16 * SR)
    for start in [2, 10]:
        for delay, frequency in [(0, 523.251), (.23, 659.255), (.46, 783.991)]:
            add(out, tone(frequency, .9, 5), start + delay, .015)
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
    builders = [('trilha-intro', lambda: score(2, True)), ('trilha-loop', lambda: score(16)), ('ambiente-pista', lambda: motor_ambience(16, 'pista')), ('vento', lambda: motor_ambience(16, 'vento')), ('turbina-distante', lambda: motor_ambience(16, 'turbina')), ('sinal-embarque', boarding_chime)]
    report = {}
    for name, builder in builders:
        samples = builder(); soften_boundary(samples); source = stats(samples)
        target = OUT / (name + '.ogg')
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', '-ar', '44100', '-ac', '2', '-c:a', 'libvorbis', '-q:a', '5', str(target)], input=samples.tobytes(), check=True)
        report[name] = {'file': 'audio/' + name + '.ogg', 'sampleRate': 44100, 'channels': 2, 'sourceRate': SR, **decoded_stats(target), 'sourcePeak': source['peak'], 'sourceRms': source['rms'], 'loop': name != 'trilha-intro', 'origin': 'original deterministic Python synthesis; no recordings, samples, speech or quoted melodies', 'license': 'MIT, same as the project; original procedural composition and sound design', 'bpm': BPM if name.startswith('trilha') else None, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}
        print(name, round(report[name]['seconds'], 3), 'peak', round(report[name]['peak'], 4), flush=True)
    report['_generation_note'] = 'Six original synthetic files, seed2026111704. Intro2bars/loop16bars at112BPM. Note tails wrap in the music loop; all files have4ms endpoint envelopes. OGGs fully decoded for peak/RMS/duration/boundary validation. Airport chime is sparse, low-volume decorative ambience, without intelligible announcements or a gameplay warning. No third-party audio sources.'
    (OUT / 'manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
