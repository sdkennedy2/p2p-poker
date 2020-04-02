#!/usr/bin/env bash

concurrently \
  "scripts/build-node.sh --watch" \
  "sleep 5 && nodemon --watch dist/node $*"