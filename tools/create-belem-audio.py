"""Original deterministic synthetic carimbó-inspired score and stylized ambience.
No sampled recordings, voices, existing songs or third-party sound libraries.
"""
from pathlib import Path
import json, subprocess, tempfile
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io.wavfile import write

ROOT=Path('production/stages/belem/audio'); ROOT.mkdir(parents=True,exist_ok=True)
SR=44100; RNG=np.random.default_rng(20261116); BPM=110; BEAT=60/BPM

def add(out,sample,start,gain=1):
    k=round(start*SR); idx=(np.arange(len(sample))+k)%len(out)
    np.add.at(out,idx,sample*gain)

def note(freq,duration,kind):
    t=np.arange(round(duration*SR))/SR
    if kind=='flute':
        sig=(np.sin(2*np.pi*freq*t+.015*np.sin(2*np.pi*5*t))+.12*np.sin(4*np.pi*freq*t))
        env=np.minimum(t/.035,1)*np.minimum((duration-t)/.07,1)*np.exp(-t*.6)
    elif kind=='bass':
        sig=np.sin(2*np.pi*freq*t)+.18*np.sin(4*np.pi*freq*t);env=np.minimum(t/.008,1)*np.exp(-t*7)
    else:
        sig=sum(np.sin(2*np.pi*freq*h*t)/h**1.8 for h in range(1,7));env=np.minimum(t/.004,1)*np.exp(-t*9)
    return sig*np.maximum(0,env)

def music(bars,intro=False):
    dur=bars*4*BEAT; out=np.zeros(round(dur*SR))
    melody=[(0,293.665),(1.5,349.228),(2,391.995),(3,440),(4,523.251),(5.5,440),(6,391.995),(7,349.228),
            (8,293.665),(9,349.228),(10.5,440),(11.5,391.995),(12,349.228),(13.5,261.626),(14,293.665),(15.25,261.626)]
    for bar in range(bars):
        base=bar*4*BEAT
        for beat in [0,1.5,2,3]:
            t=np.arange(round(.30*SR))/SR
            drum=np.sin(2*np.pi*(65*t+9*(1-np.exp(-t*28))))*np.exp(-t*19)
            slap=RNG.normal(0,1,len(t))*np.exp(-t*60)*.2
            add(out,drum+slap,base+beat*BEAT,.19 if beat in [0,2] else .11)
        for eighth in range(8):
            t=np.arange(round(.065*SR))/SR
            shaker=sosfilt(butter(2,4500,fs=SR,btype='highpass',output='sos'),RNG.normal(size=len(t)))*np.exp(-t*65)
            add(out,shaker,base+eighth*BEAT/2,.027 if eighth%2 else .019)
        root=[146.832,130.813,116.541,130.813][bar%4]
        for beat in [0,1.5,2.75]:add(out,note(root,.42,'bass'),base+beat*BEAT,.16)
        for beat in [.5,1.75,2.5,3.5]:
            for ratio in [1,1.2,1.5]:add(out,note(root*2*ratio,.24,'pluck'),base+beat*BEAT,.027)
    if not intro:
        for shift in range(0,bars*4,16):
            for beat,freq in melody:
                if shift+beat<bars*4:add(out,note(freq,.28 if beat%1 else .4,'flute'),(shift+beat)*BEAT,.075)
    else:
        for beat,freq in [(0,293.665),(2,349.228),(4,391.995),(5,440),(6.5,523.251)]:add(out,note(freq,.35,'flute'),beat*BEAT,.055)
        out*=np.minimum(np.arange(len(out))/SR/.08,1)
    # Circular early reflections preserve sample-continuous ambience across loops.
    return out+.16*np.roll(out,round(.12*SR))+.07*np.roll(out,round(.23*SR))

def ambience(kind,duration=16):
    n=round(duration*SR);t=np.arange(n)/SR; out=np.zeros(n)
    if kind in ['agua','vento']:
        noise=RNG.normal(size=n); spectrum=np.fft.rfft(noise);f=np.fft.rfftfreq(n,1/SR)
        shape=np.exp(-f/(1100 if kind=='agua' else 420))*(1-np.exp(-f/80))
        filtered=np.fft.irfft(spectrum*shape,n=n);filtered/=np.std(filtered)
        out=filtered*(.035 if kind=='agua' else .018)*(1+.3*np.sin(2*np.pi*4*t/duration))
        if kind=='agua':
            for start in [1,4.3,8.6,12.2]:
                tt=np.arange(round(.8*SR))/SR;wave=np.sin(np.pi*tt/.8)**2*RNG.normal(size=len(tt));wave=sosfilt(butter(2,1500,fs=SR,output='sos'),wave)
                add(out,wave,start,.055)
    elif kind=='feira':
        # Nonverbal, stylized distant vocal-like babble, wooden taps and baskets.
        for k in range(40):
            dur=RNG.uniform(.2,.7);tt=np.arange(round(dur*SR))/SR;f0=RNG.uniform(100,220)
            sig=sum(np.sin(2*np.pi*f0*h*tt+RNG.uniform(0,6.28))/h for h in range(1,9))
            sig*=np.sin(np.pi*tt/dur)**2*(.6+.4*np.sin(2*np.pi*RNG.uniform(3,7)*tt))
            add(out,sig,RNG.uniform(0,duration),.008)
        for start in [2.4,7.1,11.2]:add(out,note(730,.09,'pluck'),start,.04)
    elif kind=='aves':
        for start in [2.2,2.55,8,8.24,13.2]:
            dur=.19;tt=np.arange(round(dur*SR))/SR
            sig=np.sin(2*np.pi*(2300*tt+600*tt**2/dur))*np.sin(np.pi*tt/dur)**2
            add(out,sig,start,.025)
    return out

tracks={'trilha-intro':music(2,True),'trilha-loop':music(8),'ambiente-feira':ambience('feira'),
        'ambiente-agua':ambience('agua'),'aves':ambience('aves'),'vento-tecido':ambience('vento')}
report={}
for name,mono in tracks.items():
    # Common mastering level, no per-stem peak normalization.
    stereo=np.column_stack([mono,np.roll(mono,round(.0015*SR))])
    stereo=np.clip(stereo,-.95,.95)
    with tempfile.TemporaryDirectory(prefix='belem-audio-') as td:
        wav=Path(td)/'master.wav';write(wav,SR,(stereo*32767).astype(np.int16))
        target=ROOT/(name+'.ogg');subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','libvorbis','-q:a','5',str(target)],check=True)
    report[name]={'file':str(target),'seconds':len(mono)/SR,'sampleRate':SR,'channels':2,
                  'peak':float(np.max(np.abs(stereo))),'rms':float(np.sqrt(np.mean(stereo**2))),
                  'loop':name!='trilha-intro','origin':'original deterministic synthesis','bpm':BPM if name.startswith('trilha') else None}
    print(name,round(len(mono)/SR,3),'s')
(ROOT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
