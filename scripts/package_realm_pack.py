#!/usr/bin/env python3
"""
Mímir Cinema Packager: Builds the standalone 'mimir-cinematic-realm-pack.zip'
for Model A on-demand distribution, and provides automated extraction/installation.
"""

import os
import sys
import zipfile
import argparse

REALM_FILES = [
    'midgard.mp4',
    'asgard.mp4',
    'vanaheim.mp4',
    'alfheim.mp4',
    'jotunheim.mp4',
    'muspelheim.mp4',
    'niflheim.mp4',
    'nidavellir.mp4',
    'helheim.mp4',
]

def build_pack(source_dir: str = 'public/realms/videos', output_zip: str = 'mimir-cinematic-realm-pack.zip'):
    if not os.path.isdir(source_dir):
        print(f"[!] Error: Source directory '{source_dir}' does not exist.")
        return False

    missing = []
    for f in REALM_FILES:
        p = os.path.join(source_dir, f)
        if not os.path.isfile(p):
            missing.append(f)

    if missing:
        print(f"[!] Warning: Missing {len(missing)} videos in '{source_dir}': {', '.join(missing)}")
        print("    Run 'python scripts/forge_realm_videos.py --realm all' first to forge them.")
        return False

    print(f"[*] Packaging {len(REALM_FILES)} cinematic video backdrops into '{output_zip}'...")
    with zipfile.ZipFile(output_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for f in REALM_FILES:
            file_path = os.path.join(source_dir, f)
            # Store at root of zip for clean extraction into target folder
            zf.write(file_path, arcname=f)
            print(f"  + Added {f} ({os.path.getsize(file_path) / 1024 / 1024:.2f} MB)")

    size_mb = os.path.getsize(output_zip) / (1024 * 1024)
    print(f"[✓] Successfully created '{output_zip}' ({size_mb:.2f} MB)")
    return True

def install_pack(zip_path: str = 'mimir-cinematic-realm-pack.zip', target_dir: str = 'public/realms/videos'):
    if not os.path.isfile(zip_path):
        print(f"[!] Error: Archive '{zip_path}' not found.")
        return False

    os.makedirs(target_dir, exist_ok=True)
    print(f"[*] Extracting realm videos from '{zip_path}' to '{target_dir}'...")
    with zipfile.ZipFile(zip_path, 'r') as zf:
        extracted = 0
        for f in REALM_FILES:
            if f in zf.namelist():
                zf.extract(f, target_dir)
                extracted += 1
            elif f"videos/{f}" in zf.namelist():
                # Extract and write directly to target_dir/f
                content = zf.read(f"videos/{f}")
                with open(os.path.join(target_dir, f), 'wb') as out_f:
                    out_f.write(content)
                extracted += 1

    print(f"[✓] Installed {extracted}/{len(REALM_FILES)} realm videos to '{target_dir}'.")
    return True

def main():
    parser = argparse.ArgumentParser(description="Mímir Cinema Packager & Installer")
    parser.add_argument('--build', action='store_true', help="Package public/realms/videos into mimir-cinematic-realm-pack.zip")
    parser.add_argument('--install', type=str, default=None, help="Install an existing zip into target directory (e.g. --install public/realms/videos or dist/realms/videos)")
    parser.add_argument('--zip', type=str, default='mimir-cinematic-realm-pack.zip', help="Path to zip file (default: mimir-cinematic-realm-pack.zip)")
    args = parser.parse_args()

    if args.install:
        install_pack(args.zip, args.install)
    else:
        build_pack(output_zip=args.zip)

if __name__ == '__main__':
    main()
