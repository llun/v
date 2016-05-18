let video = document.getElementById('player');
let url = '/videos/video.mp4';

let events = ['error', 'abort', 'sourceopen', 'sourceended', 'sourceclose',
  'addsourcebuffer', 'removesourcebuffer', 'updatestart', 'updateend', 'update'];
let logEvent = (name, e) => console.log(name, e);
let handleAllEvents = object => {
  events.forEach(name => {
    object.addEventListener(name, logEvent.bind(null, name));
  })
}
let fetchVideo = (url, cb) => {
  let xhr = new XMLHttpRequest;
  xhr.open('get', url);
  xhr.responseType = 'arraybuffer';
  xhr.addEventListener('load', () => cb(xhr.response));
  xhr.send();
}

let mediaSource = new MediaSource;
handleAllEvents(mediaSource);

video.src = URL.createObjectURL(mediaSource);
mediaSource.addEventListener('sourceopen', function(e) {
  fetchVideo(url, buf => {
    let mp4box = new MP4Box();
    mp4box.onSegment = (id, user, buffer) => {
      user.pending.push(buffer);
    }
    mp4box.onReady = info => {
      console.log(info);
      let buffers = [];
      info.tracks.forEach(track => {
        let mime = `video/mp4; codecs="${track.codec}"`;
        console.log(mime);
        if (!MediaSource.isTypeSupported(mime)) return;

        let sourceBuffer = mediaSource.addSourceBuffer(mime);
        sourceBuffer.trackId = track.id;
        sourceBuffer.pending = [];
        sourceBuffer.mediaSource = mediaSource;
        handleAllEvents(sourceBuffer);
        sourceBuffer.addEventListener('updateend', function() {
          if (this.pending.length === 0) {
            let allPendings = [];
            let reduced = buffers.reduce((all, list) => all.concat(list.pending), allPendings);
            console.log(reduced, buffers);
            if (reduced.length === 0) {
              this.mediaSource.endOfStream();
              console.log(this.trackId, 'endofstream');
            }
            return;
          }
          let head = this.pending.shift();
          this.appendBuffer(head);
        }.bind(sourceBuffer));
        mp4box.setSegmentOptions(track.id, sourceBuffer, { nbSamples: 1000 });
        buffers.push(sourceBuffer);
      });

      let initializeSegments = mp4box.initializeSegmentation();
      initializeSegments.forEach(segment => {
        segment.user.pending.push(segment.buffer);
      });
      mp4box.start();
      console.log(buffers);
      buffers.forEach(buffer => {
        console.log('init buffer', buffer);
        let head = buffer.pending.shift();
        buffer.appendBuffer(head);
      });
    }

    buf.fileStart = 0;
    mp4box.appendBuffer(buf);
  });
});
