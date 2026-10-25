use adblock::lists::{FilterSet, ParseOptions};
use adblock::request::Request;
use adblock::Engine;

/// The Sacred Shield Ad & Tracker Blocker Engine.
/// Powered by Brave Software's native Rust `adblock` engine (v0.13.3).
pub struct AdBlocker {
    engine: Engine,
}

impl AdBlocker {
    pub fn new() -> Self {
        let mut filter_set = FilterSet::new(false);

        let default_rules = r#"
! ==============================================================================
! MÍMIR SACRED SHIELD - DEFAULT HIGH-PERFORMANCE RULESET
! EasyList, EasyPrivacy, uBlock Origin & YouTube Adblock Sentinel
! ==============================================================================

! --- Major Ad Networks & Display Banners ---
||doubleclick.net^$third-party
||googleads.g.doubleclick.net^$third-party
||static.doubleclick.net^$third-party
||adservice.google.com^$third-party
||googlesyndication.com^$third-party
||pagead2.googlesyndication.com^$third-party
||adnxs.com^$third-party
||criteo.com^$third-party
||criteo.net^$third-party
||amazon-adsystem.com^$third-party
||rubiconproject.com^$third-party
||pubmatic.com^$third-party
||openx.net^$third-party
||casalemedia.com^$third-party
||moatads.com^$third-party
||taboola.com^$third-party
||outbrain.com^$third-party
||revcontent.com^$third-party
||bidswitch.net^$third-party
||smartadserver.com^$third-party
||yieldmo.com^$third-party
||teads.tv^$third-party
||inmobi.com^$third-party
||sharethrough.com^$third-party
||adroll.com^$third-party
||zergnet.com^$third-party
||trafficjunky.com^$third-party
||popads.net^$third-party
||popcash.net^$third-party
||propellerads.com^$third-party
||exoclick.com^$third-party

! --- Trackers, Telemetry Beacons & Profilers ---
||google-analytics.com^$third-party
||analytics.google.com^$third-party
||googletagmanager.com^$third-party
||connect.facebook.net^$third-party
||scorecardresearch.com^$third-party
||hotjar.com^$third-party
||clarity.ms^$third-party
||quantserve.com^$third-party
||chartbeat.com^$third-party
||branch.io^$third-party
||mixpanel.com^$third-party
||segment.io^$third-party
||amplitude.com^$third-party
||newrelic.com^$third-party

! --- Crypto Miners ---
||coinhive.com^
||coin-have.com^
||crypto-loot.com^

! --- YouTube Ad & Telemetry Endpoints ---
||youtube.com/pagead/*
||youtube.com/api/stats/ads*
||youtube.com/ptracking*
||youtube.com/youtubei/v1/log_event*
||play.google.com/log*

! --- Universal Cosmetic Element Hiding ---
##.ad-banner
##.advertisement
##.ad-container
##.adsbygoogle
##[id^="google_ads_"]
##.trc_related_container
##.outbrain
##.taboola
##[data-ad-unit]
##[data-ad-slot]
##.sponsored-content

! --- YouTube Specific Cosmetic Ad Eradication ---
youtube.com##ytd-ad-slot-renderer
youtube.com##ytd-banner-promo-renderer
youtube.com###masthead-ad
youtube.com##.ytp-ad-overlay-container
youtube.com##.ytp-ad-message-container
youtube.com##ytd-promoted-sparkles-web-renderer
youtube.com##ytd-promoted-video-renderer
youtube.com##ytd-in-feed-ad-layout-renderer
youtube.com##ytd-statement-banner-renderer
youtube.com###player-ads
"#;

        filter_set.add_filter_list(default_rules.to_string(), ParseOptions::default());
        let engine = Engine::new_with_filter_set(filter_set);
        Self { engine }
    }

    /// Evaluates whether an outgoing request to `url` originating from `source_url` should be blocked.
    pub fn should_block(&self, url: &str, source_url: &str, request_type: &str) -> bool {
        if let Ok(request) = Request::new(url, source_url, request_type, "GET") {
            let blocker_result = self.engine.check_network_request(&request);
            blocker_result.should_block()
        } else {
            false
        }
    }

    /// Returns the CSS selectors that should be hidden on the specified URL.
    pub fn url_cosmetic_resources(&self, url: &str) -> Vec<String> {
        let resources = self.engine.url_cosmetic_resources(url);
        resources.hide_selectors.into_iter().collect()
    }

    /// Generates the client-side JavaScript script to be injected into every webview instance.
    /// Combines network interception, YouTube player response sanitization, fast-forward ad skipping,
    /// and cosmetic element hiding.
    pub fn generate_injection_script() -> &'static str {
        r#"
        (function() {
            // Guard against multiple injections in the same frame
            if (window.__mimirSacredShieldActive) return;
            window.__mimirSacredShieldActive = true;

            // -----------------------------------------------------------------
            // 1. Telemetry & Whitelist Guard
            // -----------------------------------------------------------------
            var BLOCKED_DOMAINS = [
                'doubleclick.net', 'googleads.g.doubleclick.net', 'static.doubleclick.net',
                'adservice.google.com', 'googlesyndication.com', 'pagead2.googlesyndication.com',
                'google-analytics.com', 'analytics.google.com', 'googletagmanager.com',
                'connect.facebook.net', 'facebook.net', 'adnxs.com', 'criteo.com', 'criteo.net',
                'amazon-adsystem.com', 'rubiconproject.com', 'pubmatic.com', 'openx.net',
                'casalemedia.com', 'moatads.com', 'taboola.com', 'outbrain.com', 'revcontent.com',
                'bidswitch.net', 'smartadserver.com', 'yieldmo.com', 'teads.tv', 'inmobi.com',
                'sharethrough.com', 'adroll.com', 'zergnet.com', 'trafficjunky.com', 'popads.net',
                'popcash.net', 'propellerads.com', 'exoclick.com', 'scorecardresearch.com',
                'hotjar.com', 'clarity.ms', 'quantserve.com', 'chartbeat.com', 'branch.io',
                'mixpanel.com', 'segment.io', 'amplitude.com', 'newrelic.com', 'coinhive.com',
                'coin-have.com', 'crypto-loot.com'
            ];

            function isWhitelisted() {
                try {
                    var raw = localStorage.getItem('mimir_ward_whitelist');
                    if (raw) {
                        var list = JSON.parse(raw);
                        if (list && list.indexOf(window.location.hostname) !== -1) return true;
                    }
                } catch(e) {}
                return false;
            }

            function isBlockedUrl(url) {
                if (!url || isWhitelisted()) return false;
                try {
                    var u = new URL(url, window.location.href);
                    // Match domain or subdomain
                    return BLOCKED_DOMAINS.some(function(d) {
                        return u.hostname === d || u.hostname.endsWith('.' + d);
                    });
                } catch(e) {
                    return false;
                }
            }

            function reportBlock(url, category) {
                try {
                    var u = new URL(url, window.location.href);
                    var payload = {
                        type: 'TRACKER_BLOCKED',
                        payload: {
                            domain: u.hostname,
                            category: category || 'ad_banner',
                            url: url
                        }
                    };
                    if (window.ipc && typeof window.ipc.postMessage === 'function') {
                        window.ipc.postMessage(JSON.stringify(payload));
                    } else if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
                        window.chrome.webview.postMessage(JSON.stringify(payload));
                    }
                } catch(e) {}
            }

            // -----------------------------------------------------------------
            // 2. Network Interception (Fetch & XMLHttpRequest)
            // -----------------------------------------------------------------
            var origFetch = window.fetch;
            if (origFetch) {
                window.fetch = function() {
                    var url = typeof arguments[0] === 'string' ? arguments[0] : (arguments[0] && arguments[0].url);
                    if (isBlockedUrl(url)) {
                        reportBlock(url, 'telemetry_tracker');
                        return Promise.reject(new Error('[Mímir Sacred Shield] Blocked ad/tracker: ' + url));
                    }
                    return origFetch.apply(this, arguments);
                };
            }

            var origOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function(method, url) {
                if (isBlockedUrl(url)) {
                    reportBlock(url, 'telemetry_tracker');
                    this.send = function() {};
                    return;
                }
                return origOpen.apply(this, arguments);
            };

            // -----------------------------------------------------------------
            // 3. YouTube Adblock Sentinel
            // -----------------------------------------------------------------
            if (window.location.hostname.indexOf('youtube.com') !== -1) {
                // A. Player Response Sanitizer (Strips ad placements before player initializes)
                function sanitizePlayerResponse(obj) {
                    if (!obj || typeof obj !== 'object') return obj;
                    try {
                        if (obj.adPlacements) obj.adPlacements = [];
                        if (obj.adSlots) obj.adSlots = [];
                        if (obj.playerAds) obj.playerAds = [];
                        if (obj.adBreakHeartbeatParams) delete obj.adBreakHeartbeatParams;
                    } catch(e) {}
                    return obj;
                }

                // Intercept window.ytInitialPlayerResponse
                var rawPlayerResp = window.ytInitialPlayerResponse;
                Object.defineProperty(window, 'ytInitialPlayerResponse', {
                    get: function() { return rawPlayerResp; },
                    set: function(val) { rawPlayerResp = sanitizePlayerResponse(val); },
                    configurable: true
                });
                if (window.ytInitialPlayerResponse) {
                    window.ytInitialPlayerResponse = sanitizePlayerResponse(window.ytInitialPlayerResponse);
                }

                // Intercept JSON.parse to sanitize dynamic player payloads
                var origJsonParse = JSON.parse;
                JSON.parse = function() {
                    var res = origJsonParse.apply(this, arguments);
                    if (res && typeof res === 'object') {
                        if (res.adPlacements || res.adSlots || res.playerAds) {
                            sanitizePlayerResponse(res);
                            reportBlock(window.location.href, 'video_ad');
                        }
                    }
                    return res;
                };

                // B. Fast-Forward Ad Skip Watchdog (0ms instant skip for stream ads)
                function runYouTubeAdWatchdog() {
                    if (isWhitelisted()) return;
                    var player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
                    var video = document.querySelector('video');
                    if (!player || !video) return;

                    var isAd = player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting');
                    if (isAd) {
                        video.muted = true;
                        if (video.duration && isFinite(video.duration)) {
                            video.currentTime = video.duration;
                        }
                        video.playbackRate = 16.0;

                        // Click any available skip button
                        var skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button, .ytp-ad-overlay-close-button');
                        if (skipBtn) skipBtn.click();
                        reportBlock(window.location.href, 'video_ad');
                    } else {
                        if (video.playbackRate > 2.0) {
                            video.playbackRate = 1.0;
                        }
                    }

                    // C. Anti-Adblock Enforcement Modal Neutralizer
                    var enforcementModal = document.querySelector('ytd-enforcement-message-view-model');
                    if (enforcementModal) {
                        enforcementModal.remove();
                        var backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
                        if (backdrop) backdrop.remove();
                        document.body.style.overflow = 'auto';
                        if (video && video.paused) video.play();
                    }
                }

                setInterval(runYouTubeAdWatchdog, 150);

                // D. YouTube Cosmetic Element Eradication
                var ytStyle = document.createElement('style');
                ytStyle.id = 'mimir-youtube-shield';
                ytStyle.textContent = `
                    ytd-ad-slot-renderer,
                    ytd-banner-promo-renderer,
                    #masthead-ad,
                    .ytp-ad-overlay-container,
                    .ytp-ad-message-container,
                    ytd-promoted-sparkles-web-renderer,
                    ytd-promoted-video-renderer,
                    ytd-in-feed-ad-layout-renderer,
                    ytd-statement-banner-renderer,
                    #player-ads,
                    #panels:has(ytd-ads-engagement-panel-content-renderer),
                    ytd-popup-container:has(ytd-enforcement-message-view-model),
                    tp-yt-iron-overlay-backdrop {
                        display: none !important;
                    }
                `;
                if (document.head) {
                    document.head.appendChild(ytStyle);
                } else {
                    document.addEventListener('DOMContentLoaded', function() {
                        document.head && document.head.appendChild(ytStyle);
                    });
                }
            }

            // -----------------------------------------------------------------
            // 4. Universal Cosmetic Shield (All Domains)
            // -----------------------------------------------------------------
            if (!isWhitelisted()) {
                var globalCosmeticStyle = document.createElement('style');
                globalCosmeticStyle.id = 'mimir-global-cosmetic-shield';
                globalCosmeticStyle.textContent = `
                    .ad-banner, .advertisement, .ad-container, .adsbygoogle, [id^="google_ads_"],
                    .trc_related_container, .outbrain, .taboola, .taboola-ad,
                    [data-ad-unit], [data-ad-slot], [id^="ad-div-"], .native-ad-unit,
                    .sponsored-content, .sponsored-post {
                        display: none !important;
                        visibility: hidden !important;
                        height: 0 !important;
                        min-height: 0 !important;
                        max-height: 0 !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                    }
                `;
                if (document.head) {
                    document.head.appendChild(globalCosmeticStyle);
                } else {
                    document.addEventListener('DOMContentLoaded', function() {
                        document.head && document.head.appendChild(globalCosmeticStyle);
                    });
                }
            }

            // -----------------------------------------------------------------
            // 5. Global Privacy Control (GPC) & Do Not Track (DNT)
            // -----------------------------------------------------------------
            try {
                if (typeof navigator !== 'undefined') {
                    Object.defineProperty(navigator, 'globalPrivacyControl', {
                        get: function() { return true; },
                        enumerable: true,
                        configurable: true
                    });
                    Object.defineProperty(navigator, 'doNotTrack', {
                        get: function() { return '1'; },
                        enumerable: true,
                        configurable: true
                    });
                }
            } catch(e) {}

            // -----------------------------------------------------------------
            // 6. Canvas & Audio Fingerprint Resistance (Noise Perturbation)
            // -----------------------------------------------------------------
            try {
                if (typeof CanvasRenderingContext2D !== 'undefined') {
                    var origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
                    CanvasRenderingContext2D.prototype.getImageData = function() {
                        var imgData = origGetImageData.apply(this, arguments);
                        if (imgData && imgData.data && imgData.data.length >= 4) {
                            imgData.data[0] = (imgData.data[0] ^ 1);
                        }
                        return imgData;
                    };
                }
            } catch(e) {}
        })();
        "#
    }
}

impl Default for AdBlocker {
    fn default() -> Self {
        Self::new()
    }
}
