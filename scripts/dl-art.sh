#!/bin/zsh
# usage: dl-art.sh < lines of "<name> <url>" ; writes images/sermons/<name>.jpg
cd "$(dirname "$0")/../images/sermons" || exit 1
while read -r name url; do
  [ -z "$name" ] && continue
  ( curl -sL -o "$name.png" "$url" && sips -s format jpeg -s formatOptions 82 "$name.png" --out "$name.jpg" >/dev/null && rm "$name.png" && echo "ok $name" ) &
done
wait
