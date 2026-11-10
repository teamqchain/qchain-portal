#!/bin/bash
# Renders tool/splash/out/render.html frame by frame (60 fps, 0 to 4.0 s) with
# headless Chrome and encodes web/splash/qp_splash.webm + .mp4.
# Run from the repo root after build_splash.py:  bash tool/splash/render_video.sh
set -euo pipefail
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
OUT=tool/splash/out
FRAMES=$OUT/frames
FPS=60; LAST=240   # 240 frames = 4.0 s
rm -rf "$FRAMES"; mkdir -p "$FRAMES" web/splash
PAGE="file://$PWD/$OUT/render.html"

export CHROME PAGE FRAMES FPS
seq 0 $LAST | xargs -P 6 -I{} bash -c '
  ms=$(( {} * 1000 / FPS ))
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=2560,1440 \
    --virtual-time-budget=600 --screenshot="$FRAMES/f$(printf %04d {}).png" "$PAGE#$ms" >/dev/null 2>&1'

ffmpeg -y -loglevel error -framerate $FPS -i "$FRAMES/f%04d.png" \
  -c:v libvpx-vp9 -pix_fmt yuv420p -b:v 0 -crf 36 -row-mt 1 -an web/splash/qp_splash.webm
ffmpeg -y -loglevel error -framerate $FPS -i "$FRAMES/f%04d.png" \
  -c:v libx264 -pix_fmt yuv420p -crf 24 -preset slow -movflags +faststart -an web/splash/qp_splash.mp4
ls -l web/splash
