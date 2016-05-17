#!/bin/sh
npm install -g http-server
mkdir -p videos
curl http://www.sample-videos.com/video/mp4/360/big_buck_bunny_360p_5mb.mp4 -o videos/video.mp4
http-server .
