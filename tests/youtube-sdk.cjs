// Controlled external SDK boundary: exercise the real ReactPlayer lifecycle
// without YouTube network requests or device-dependent autoplay permissions.
module.exports = function installYouTubeTestSDK() {
  window.__shortsPlayerInstances = [];
  window.__shortsBlockFirstPlay = true;
  window.YT = {
    loaded: 1,
    PlayerState: { UNSTARTED: -1, PLAYING: 1, PAUSED: 2, BUFFERING: 3, ENDED: 0, CUED: 5 },
    Player: class {
      constructor(container, options) {
        this.options = options;
        this.id = options.videoId;
        this.muted = Boolean(options.playerVars.mute);
        this.state = -1;
        this.listeners = {};
        this.started = Date.now();
        this.iframe = document.createElement('iframe');
        this.iframe.title = 'YouTube test player';
        this.iframe.style.cssText = 'width:100%;height:100%;border:0;background:#111';
        this.iframe.srcdoc = '<body style="background:#111"></body>';
        container.replaceWith(this.iframe);
        window.__shortsPlayerInstances.push(this);
        setTimeout(() => options.events.onReady({ target: this }), 0);
      }
      emit(event, data) {
        this.options.events[event]?.({ target: this, data });
        const callback = this.listeners[event];
        if (callback) window[callback]({ target: this, data });
      }
      addEventListener(event, callback) { this.listeners[event] = callback; }
      removeEventListener(event) { delete this.listeners[event]; }
      playVideo() {
        if (window.__shortsBlockFirstPlay) {
          window.__shortsBlockFirstPlay = false;
          this.emit('onAutoplayBlocked');
          return;
        }
        if (this.state === 1) return;
        this.state = 1;
        this.emit('onStateChange', 1);
      }
      pauseVideo() { if (this.state === 2) return; this.state = 2; this.emit('onStateChange', 2); }
      stopVideo() { this.state = 0; }
      cueVideoById({ videoId }) {
        this.id = videoId;
        this.state = 5;
        setTimeout(() => this.emit('onStateChange', 5), 0);
      }
      mute() { this.muted = true; }
      unMute() { this.muted = false; }
      isMuted() { return this.muted; }
      getVideoData() { return { video_id: this.id }; }
      getPlayerState() { return this.state; }
      getIframe() { return this.iframe; }
      getDuration() { return 60; }
      getCurrentTime() { return (Date.now() - this.started) / 1000; }
      getVideoLoadedFraction() { return 1; }
      getPlaylist() { return null; }
      setVolume() {}
      setLoop() {}
    },
  };
};
