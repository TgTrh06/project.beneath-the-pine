"""Generate the three original, seamless demo soundscapes with Python stdlib."""

import math
import random
import wave
from pathlib import Path

RATE = 16000
SECONDS = 12
COUNT = RATE * SECONDS
FADE = RATE // 2
ROOT = Path(__file__).parent


def render(name: str, seed: int):
    rng = random.Random(seed)
    output = []
    low = 0.0
    mid = 0.0
    previous = 0.0
    for i in range(COUNT):
        t = i / RATE
        noise = rng.uniform(-1, 1)
        low += 0.012 * (noise - low)
        mid += 0.085 * (noise - mid)
        if name == "rain":
            value = 0.18 * (noise - mid) + 0.25 * (mid - low) + 0.11 * low
        elif name == "stream":
            value = 0.32 * (mid - low) + 0.13 * low + 0.06 * math.sin(2 * math.pi * 1.4 * t) * mid
        else:
            chirps = 0.0
            for start, pitch in ((1.2, 1220), (3.8, 1640), (6.3, 1390), (9.1, 1770)):
                phase = t - start
                if 0 < phase < 0.28:
                    chirps += 0.075 * math.sin(math.pi * phase / 0.28) * math.sin(2 * math.pi * (pitch * phase + 510 * phase * phase))
            value = 0.16 * low + 0.07 * (mid - low) + chirps
        previous = 0.88 * previous + 0.12 * value
        output.append(previous)

    for i in range(FADE):
        weight = i / FADE
        output[COUNT - FADE + i] = output[COUNT - FADE + i] * (1 - weight) + output[i] * weight
    peak = max(abs(value) for value in output)
    scale = 0.7 / peak if peak else 1
    samples = b"".join(int(max(-1, min(1, value * scale)) * 32767).to_bytes(2, "little", signed=True) for value in output)
    with wave.open(str(ROOT / f"{name}.wav"), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(RATE)
        target.writeframes(samples)


for sound, number in (("rain", 17), ("forest", 29), ("stream", 43)):
    render(sound, number)
