#!/bin/bash
set -e

git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"

if cd flutter; then git pull && cd ..; else git clone https://github.com/flutter/flutter.git -b stable --depth 1; fi

flutter/bin/flutter config --enable-web