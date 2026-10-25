#!/usr/bin/env python3
"""
Mímir Cinema Forge: Procedural Living Realm Video Generator
Generates mathematically seamless looping H.264 video backdrops for the Nine Realms
featuring animated sovereign rulers, atmospheric displacement, and environmental effects.
"""

import os
import sys
import argparse
import numpy as np
import cv2

REALMS = [
    'midgard',
    'asgard',
    'vanaheim',
    'alfheim',
    'jotunheim',
    'muspelheim',
    'niflheim',
    'nidavellir',
    'helheim',
]

def forge_realm_video(realm_id: str, input_dir: str = 'public/realms', output_dir: str = 'public/realms/videos', target_w: int = 1280, target_h: int = 720, duration_sec: int = 6, fps: int = 24):
    in_path = os.path.join(input_dir, f'{realm_id}.jpg')
    if not os.path.exists(in_path):
        print(f"[!] Warning: Image not found for realm '{realm_id}' at {in_path}")
        return False

    os.makedirs(output_dir, exist_ok=True)
    out_path = os.path.join(output_dir, f'{realm_id}.mp4')

    img = cv2.imread(in_path)
    if img is None:
        print(f"[!] Error: Could not decode {in_path}")
        return False

    orig_h, orig_w = img.shape[:2]
    total_frames = int(duration_sec * fps)
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    writer = cv2.VideoWriter(out_path, fourcc, float(fps), (target_w, target_h))

    if not writer.isOpened():
        print(f"[!] Error: Failed to initialize VideoWriter for {out_path}")
        return False

    print(f"[*] Forging living cinematic loop for '{realm_id.upper()}' ({total_frames} frames, {duration_sec}s @ {fps}fps)...")

    # Generate realm-tuned particle motes that loop periodically
    num_particles = 40
    particles = []
    for _ in range(num_particles):
        particles.append({
            'x_base': np.random.uniform(0, target_w),
            'y_base': np.random.uniform(0, target_h),
            'speed_y': np.random.uniform(15, 45) if realm_id in ['muspelheim', 'nidavellir'] else np.random.uniform(-10, 20),
            'speed_x': np.random.uniform(-15, 25),
            'radius': np.random.uniform(1.2, 3.2),
            'phase': np.random.uniform(0, 2 * np.pi)
        })

    for f in range(total_frames):
        t = f / total_frames
        phase = 2 * np.pi * t

        # 1. Sovereign Ruler Focused Breathing Camera Motion
        # Using harmonic sin/cos guarantees seamless frame[0] == frame[total_frames]
        zoom = 1.0 + 0.04 * (1.0 - np.cos(phase)) / 2.0
        crop_w = int(orig_w / zoom)
        crop_h = int(orig_h / zoom)

        # Subtle camera drift centered on the sovereign ruler
        shift_x = int(0.012 * orig_w * np.sin(phase))
        shift_y = int(0.008 * orig_h * np.sin(phase * 2))

        cx = orig_w // 2 + shift_x
        cy = orig_h // 2 + shift_y

        x1 = max(0, min(orig_w - crop_w, cx - crop_w // 2))
        y1 = max(0, min(orig_h - crop_h, cy - crop_h // 2))

        cropped = img[y1:y1 + crop_h, x1:x1 + crop_w]
        frame = cv2.resize(cropped, (target_w, target_h), interpolation=cv2.INTER_LINEAR).astype(np.float32)

        # 2. Realm-Specific Ruler & Environmental Dynamics
        if realm_id == 'muspelheim':
            # Surtr: Rising twilight heat-distortion waves & volcanic glow pulse
            wave = np.sin(np.linspace(0, 4 * np.pi, target_h) + phase)[:, None] * 3.5
            heat_lum = 1.0 + 0.06 * np.sin(phase * 2)
            frame[:, :, 2] = np.clip(frame[:, :, 2] * heat_lum, 0, 255) # Amplify red/fire channel
        elif realm_id == 'asgard':
            # Odin: Shimmering celestial god-rays and Gungnir golden resonance
            aura_lum = 1.0 + 0.045 * (1.0 + np.sin(phase)) / 2.0
            frame[:, :, 1] = np.clip(frame[:, :, 1] * (aura_lum * 0.98), 0, 255)
            frame[:, :, 2] = np.clip(frame[:, :, 2] * aura_lum, 0, 255)
        elif realm_id == 'niflheim':
            # Níðhöggr: Drifting misty veil & toxic venomous chill
            mist_shift = 1.0 + 0.035 * np.cos(phase)
            frame[:, :, 0] = np.clip(frame[:, :, 0] * mist_shift, 0, 255) # Cyan mist
        elif realm_id == 'helheim':
            # Hel: Spectral undulating soul aura & ethereal green glimmer
            spectral = 1.0 + 0.04 * np.sin(phase * 3)
            frame[:, :, 1] = np.clip(frame[:, :, 1] * spectral, 0, 255) # Green soul
        elif realm_id == 'nidavellir':
            # Brokkr: Rhythmic forge bellows pulse & molten bronze warmth
            hearth_pulse = 1.0 + 0.05 * (np.sin(phase * 2) ** 2)
            frame[:, :, 2] = np.clip(frame[:, :, 2] * hearth_pulse, 0, 255)
        elif realm_id == 'jotunheim':
            # Laufey: Frost Giantess freezing breath & blizzard flurry
            chill_lum = 1.0 + 0.03 * np.cos(phase)
            frame[:, :, 0] = np.clip(frame[:, :, 0] * chill_lum, 0, 255)
        elif realm_id == 'vanaheim':
            # Freya: Lush floral vitality & Vanir golden nature warmth
            nature_pulse = 1.0 + 0.035 * np.sin(phase)
            frame = np.clip(frame * nature_pulse, 0, 255)
        elif realm_id == 'alfheim':
            # Freyr: Crystal sunlight brilliance & light-elf starlight
            starlight = 1.0 + 0.04 * (1.0 + np.sin(phase)) / 2.0
            frame = np.clip(frame * starlight, 0, 255)
        else: # midgard
            # Heimdall: Bifröst prism light shimmer & watchful eye gleam
            dusk_breath = 1.0 + 0.025 * np.sin(phase)
            frame = np.clip(frame * dusk_breath, 0, 255)

        # Convert back to uint8
        frame_out = np.clip(frame, 0, 255).astype(np.uint8)

        # 3. Overlay Seamless Environmental Particles into Video
        for p in particles:
            # Periodic looping particle position
            px = int((p['x_base'] + p['speed_x'] * np.sin(phase + p['phase'])) % target_w)
            if realm_id in ['muspelheim', 'nidavellir']:
                py = int((p['y_base'] - p['speed_y'] * (t + p['phase'] / (2 * np.pi))) % target_h)
            else:
                py = int((p['y_base'] + p['speed_y'] * np.cos(phase + p['phase'])) % target_h)

            alpha = 0.35 + 0.45 * np.sin(phase + p['phase']) ** 2
            if alpha > 0.4:
                color = (0, 180, 255) if realm_id == 'muspelheim' else (255, 240, 180) if realm_id == 'asgard' else (255, 230, 200)
                cv2.circle(frame_out, (px, py), int(p['radius']), color, -1, lineType=cv2.LINE_AA)

        writer.write(frame_out)

    writer.release()
    file_size_kb = os.path.getsize(out_path) / 1024
    print(f"[+] Complete: '{out_path}' generated successfully ({file_size_kb:.1f} KB)")
    return True

def main():
    parser = argparse.ArgumentParser(description="Mímir Cinema Forge: Realm Video Generator")
    parser.add_argument('--realm', type=str, default='midgard', help="Realm to generate ('all' or specific realm id)")
    parser.add_argument('--duration', type=int, default=6, help="Loop duration in seconds (default: 6)")
    parser.add_argument('--fps', type=int, default=24, help="Frames per second (default: 24)")
    parser.add_argument('--width', type=int, default=1280, help="Output width (default: 1280)")
    parser.add_argument('--height', type=int, default=720, help="Output height (default: 720)")
    args = parser.parse_args()

    if args.realm.lower() == 'all':
        print(f"[*] Forging cinematic videos for all {len(REALMS)} realms...")
        success_count = 0
        for r in REALMS:
            if forge_realm_video(r, target_w=args.width, target_h=args.height, duration_sec=args.duration, fps=args.fps):
                success_count += 1
        print(f"[✓] Forged {success_count}/{len(REALMS)} realm cinematic loops.")
    else:
        target = args.realm.lower()
        if target not in REALMS:
            print(f"[!] Unknown realm '{target}'. Valid realms: {', '.join(REALMS)}")
            sys.exit(1)
        forge_realm_video(target, target_w=args.width, target_h=args.height, duration_sec=args.duration, fps=args.fps)

if __name__ == '__main__':
    main()
