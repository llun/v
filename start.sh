#!/bin/sh
npm install -g http-server
mkdir -p videos
curl http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4 -o videos/video.mp4
http-server -p 9000 .
