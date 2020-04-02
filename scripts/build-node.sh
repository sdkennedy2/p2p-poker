#!/usr/bin/env bash
node_modules/.bin/babel src -d dist/node --env-name 'node' --extensions '.ts,.tsx' --copy-files $*