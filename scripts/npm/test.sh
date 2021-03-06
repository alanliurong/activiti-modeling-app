 #!/usr/bin/env bash
TARGET=$1

if [[  $TARGET == "dev" ]]; then
    ng test --detectOpenHandles --notify
elif [[  $TARGET == "watch" ]]; then
    jest --watch --notify --detectOpenHandles --config jest.config.js $2
else
    ng test
fi
