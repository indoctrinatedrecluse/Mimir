import { ActiveMediaSession, RealmId } from '@/types';
import { mimirIpc } from '@/core/ipc/bridge';
import { runicAudio } from '@/core/audio/runicAudio';

type MediaListener = (session: ActiveMediaSession | null) => void;

class MediaController {
  private activeSession: ActiveMediaSession | null = null;
  private listeners: Set<MediaListener> = new Set();
  private progressInterval: number | null = null;

  constructor() {
    this.startProgressTicker();
  }

  public subscribe(listener: MediaListener): () => void {
    this.listeners.add(listener);
    listener(this.activeSession);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.activeSession ? { ...this.activeSession } : null));
  }

  public getSession(): ActiveMediaSession | null {
    return this.activeSession;
  }

  /**
   * Synchronize or register media from an active tab or ambient generator
   */
  public registerMedia(tabId: string, tabTitle: string, tabRealm: RealmId, url: string, isAmbient = false) {
    // If it's ambient sound
    if (isAmbient) {
      this.activeSession = {
        tabId: 'ambient',
        tabTitle: 'Runic Ambient Loom',
        tabRealm,
        url: 'mimir://ambient',
        title: `${tabRealm.toUpperCase()} Cosmic Resonance`,
        artist: 'Yggdrasil Atmosphere',
        isPlaying: true,
        currentTime: 0,
        duration: 3600,
        volume: 0.6,
        volumeBoost: 1.0,
        playbackRate: 1.0,
        isMuted: false,
        isPipActive: false,
        mediaType: 'ambient',
      };
      this.notify();
      return;
    }

    // Tab-based web media
    const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
    const isSpotify = url.includes('spotify.com') || url.includes('soundcloud.com');
    const mediaType: 'video' | 'audio' = isSpotify ? 'audio' : 'video';

    // Parse friendly title
    let displayTitle = tabTitle;
    let artist = new URL(url).hostname.replace('www.', '');

    if (isYoutube && tabTitle.includes(' - YouTube')) {
      displayTitle = tabTitle.replace(' - YouTube', '');
      artist = 'YouTube Stream';
    }

    this.activeSession = {
      tabId,
      tabTitle,
      tabRealm,
      url,
      title: displayTitle || 'Active Web Broadcast',
      artist,
      isPlaying: true,
      currentTime: 45,
      duration: 240,
      volume: 0.8,
      volumeBoost: 1.0,
      playbackRate: 1.0,
      isMuted: false,
      isPipActive: false,
      mediaType,
    };
    this.notify();
  }

  public clearSession() {
    this.activeSession = null;
    this.notify();
  }

  public togglePlay() {
    if (!this.activeSession) return;
    const nextState = !this.activeSession.isPlaying;
    this.activeSession.isPlaying = nextState;

    if (this.activeSession.tabId === 'ambient') {
      if (nextState) {
        runicAudio.startAmbient(this.activeSession.tabRealm);
      } else {
        runicAudio.stopAmbient();
      }
    } else {
      const script = `
        (function() {
          try {
            var media = document.querySelector('video, audio');
            if (media) {
              if (${nextState}) { media.play(); } else { media.pause(); }
            }
          } catch(e) {}
        })();
      `;
      mimirIpc.send({ type: 'EXECUTE_SCRIPT', payload: { script } });
    }
    this.notify();
  }

  public seek(deltaSeconds: number) {
    if (!this.activeSession) return;
    const newTime = Math.max(0, Math.min(this.activeSession.duration, this.activeSession.currentTime + deltaSeconds));
    this.activeSession.currentTime = newTime;

    if (this.activeSession.tabId !== 'ambient') {
      const script = `
        (function() {
          try {
            var media = document.querySelector('video, audio');
            if (media) {
              media.currentTime = Math.max(0, Math.min(media.duration || 1000, media.currentTime + (${deltaSeconds})));
            }
          } catch(e) {}
        })();
      `;
      mimirIpc.send({ type: 'EXECUTE_SCRIPT', payload: { script } });
    }
    this.notify();
  }

  public seekTo(timestampSeconds: number) {
    if (!this.activeSession) return;
    this.activeSession.currentTime = Math.max(0, Math.min(this.activeSession.duration, timestampSeconds));

    if (this.activeSession.tabId !== 'ambient') {
      const script = `
        (function() {
          try {
            var media = document.querySelector('video, audio');
            if (media) {
              media.currentTime = ${timestampSeconds};
            }
          } catch(e) {}
        })();
      `;
      mimirIpc.send({ type: 'EXECUTE_SCRIPT', payload: { script } });
    }
    this.notify();
  }

  public setVolume(volume: number) {
    if (!this.activeSession) return;
    this.activeSession.volume = Math.max(0, Math.min(1, volume));
    this.activeSession.isMuted = volume === 0;

    this.applyVolumeToWebview();
    this.notify();
  }

  public setVolumeBoost(boost: number) {
    if (!this.activeSession) return;
    this.activeSession.volumeBoost = Math.max(1.0, Math.min(3.0, boost));
    this.applyVolumeToWebview();
    this.notify();
  }

  public toggleMute() {
    if (!this.activeSession) return;
    const nextMuted = !this.activeSession.isMuted;
    this.activeSession.isMuted = nextMuted;

    if (this.activeSession.tabId !== 'ambient') {
      const script = `
        (function() {
          try {
            var media = document.querySelector('video, audio');
            if (media) {
              media.muted = ${nextMuted};
            }
          } catch(e) {}
        })();
      `;
      mimirIpc.send({ type: 'EXECUTE_SCRIPT', payload: { script } });
    }
    this.notify();
  }

  public setPlaybackRate(rate: number) {
    if (!this.activeSession) return;
    this.activeSession.playbackRate = rate;

    if (this.activeSession.tabId !== 'ambient') {
      const script = `
        (function() {
          try {
            var media = document.querySelector('video, audio');
            if (media) {
              media.playbackRate = ${rate};
            }
          } catch(e) {}
        })();
      `;
      mimirIpc.send({ type: 'EXECUTE_SCRIPT', payload: { script } });
    }
    this.notify();
  }

  public togglePip() {
    if (!this.activeSession) return;
    const nextPip = !this.activeSession.isPipActive;
    this.activeSession.isPipActive = nextPip;

    if (this.activeSession.tabId !== 'ambient') {
      const script = `
        (function() {
          try {
            var video = document.querySelector('video');
            if (video) {
              if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
              } else if (video.requestPictureInPicture) {
                video.requestPictureInPicture();
              }
            }
          } catch(e) {}
        })();
      `;
      mimirIpc.send({ type: 'EXECUTE_SCRIPT', payload: { script } });
    }
    this.notify();
  }

  private applyVolumeToWebview() {
    if (!this.activeSession || this.activeSession.tabId === 'ambient') return;
    const vol = this.activeSession.isMuted ? 0 : this.activeSession.volume;
    const boost = this.activeSession.volumeBoost;

    const script = `
      (function() {
        try {
          var media = document.querySelector('video, audio');
          if (media) {
            media.volume = ${vol};
            if (${boost} > 1.0 && !media.__mimirGainNode && (window.AudioContext || window.webkitAudioContext)) {
              var Actx = window.__mimirAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
              window.__mimirAudioCtx = Actx;
              var src = Actx.createMediaElementSource(media);
              var gain = Actx.createGain();
              gain.gain.value = ${boost};
              src.connect(gain);
              gain.connect(Actx.destination);
              media.__mimirGainNode = gain;
            } else if (media.__mimirGainNode) {
              media.__mimirGainNode.gain.value = ${boost};
            }
          }
        } catch(e) {}
      })();
    `;
    mimirIpc.send({ type: 'EXECUTE_SCRIPT', payload: { script } });
  }

  private startProgressTicker() {
    if (typeof window === 'undefined') return;
    this.progressInterval = window.setInterval(() => {
      if (this.activeSession && this.activeSession.isPlaying) {
        if (this.activeSession.currentTime < this.activeSession.duration) {
          this.activeSession.currentTime += 1;
          this.notify();
        }
      }
    }, 1000);
  }
}

export const mediaController = new MediaController();
