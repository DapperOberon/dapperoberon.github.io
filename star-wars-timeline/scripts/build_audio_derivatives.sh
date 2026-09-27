#!/usr/bin/env bash
# Re-encode background music to a web-friendly bitrate.
#
# The tracks are ambient background score, not critical listening, and the
# player only fetches them after the user opts in (preload="none"). 96 kbps
# joint-stereo keeps them acceptable while roughly halving the largest files.
#
# This rewrites files in place, so run it against freshly sourced audio only.
#
# Usage:
#   bash star-wars-timeline/scripts/build_audio_derivatives.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MUSIC_DIR="${ROOT}/audio/music"
BITRATE="${BITRATE:-96k}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required" >&2
  exit 1
fi

if [[ ! -d "${MUSIC_DIR}" ]]; then
  echo "Music directory not found: ${MUSIC_DIR}" >&2
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

count=0
for track in "${MUSIC_DIR}"/*.mp3; do
  [[ -e "${track}" ]] || continue
  name="$(basename "${track}")"
  ffmpeg -v error -y -i "${track}" \
    -codec:a libmp3lame -b:a "${BITRATE}" -ar 44100 -ac 2 \
    -joint_stereo 1 -map_metadata 0 \
    "${WORK_DIR}/${name}"
  count=$((count + 1))
done

if [[ "${count}" -eq 0 ]]; then
  echo "No MP3s found in ${MUSIC_DIR}" >&2
  exit 1
fi

cp "${WORK_DIR}"/*.mp3 "${MUSIC_DIR}/"
echo "Re-encoded ${count} tracks at ${BITRATE}"
du -sh "${MUSIC_DIR}"
