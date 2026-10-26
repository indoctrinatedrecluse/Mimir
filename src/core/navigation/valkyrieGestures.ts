/**
 * Valkyrie Gestures & Vim Runic Key Navigator
 * Injected into child webviews and the Mímir HUD for keyboardless mouse flight
 * and mouse-free keyboard navigation.
 */

export const VALKYRIE_GESTURE_INJECTION_SCRIPT = `
(function() {
  if (window.__valkyrieGesturesInstalled) return;
  window.__valkyrieGesturesInstalled = true;

  // --- 1. VALKYRIE FLIGHT (Right-Click Drag Gestures) ---
  var isMouseDown = false;
  var startX = 0, startY = 0;
  var lastX = 0, lastY = 0;
  var points = [];
  var isGesture = false;
  var gestureDirections = [];
  var overlayCanvas = null;
  var overlayCtx = null;
  var hudBadge = null;

  var GESTURE_MAP = {
    'L': { name: 'Rewind Bifröst (Back)', rune: 'ᚱ', action: function() { window.history.back(); } },
    'R': { name: 'Advance Path (Forward)', rune: 'ᚾ', action: function() { window.history.forward(); } },
    'U': { name: 'Scroll to Pinnacle (Top)', rune: 'ᛏ', action: function() { window.scrollTo({ top: 0, behavior: 'smooth' }); } },
    'D': { name: 'Scroll to Depths (Bottom)', rune: 'ᛖ', action: function() { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); } },
    'UD': { name: 'Refresh Sacred Spring (Reload)', rune: 'ᛗ', action: function() { window.location.reload(); } },
    'DR': { name: 'Close Thread', rune: 'ᚦ', action: function() {
      postIpc({ type: 'CLOSE_TAB', payload: { tabId: '' } });
    }},
    'RU': { name: "Mímir's Eye Web Clipper", rune: 'ᛗ', action: function() {
      postIpc({ type: 'CLIP_PAGE' });
    }}
  };

  function postIpc(payload) {
    try {
      if (window.ipc && typeof window.ipc.postMessage === 'function') {
        window.ipc.postMessage(JSON.stringify(payload));
      } else if (window.chrome && window.chrome.webview && typeof window.chrome.webview.postMessage === 'function') {
        window.chrome.webview.postMessage(JSON.stringify(payload));
      }
    } catch(e) {}
  }

  function createOverlay() {
    if (overlayCanvas) return;
    overlayCanvas = document.createElement('canvas');
    overlayCanvas.id = 'valkyrie-gesture-canvas';
    overlayCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:2147483646;pointer-events:none;';
    overlayCanvas.width = window.innerWidth;
    overlayCanvas.height = window.innerHeight;
    document.documentElement.appendChild(overlayCanvas);
    overlayCtx = overlayCanvas.getContext('2d');

    hudBadge = document.createElement('div');
    hudBadge.id = 'valkyrie-hud-badge';
    hudBadge.style.cssText = 'position:fixed;display:none;z-index:2147483647;pointer-events:none;background:rgba(5,9,18,0.92);border:1px solid rgba(6,182,212,0.6);box-shadow:0 0 20px rgba(6,182,212,0.3);color:#e2e8f0;padding:6px 14px;border-radius:10px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;font-weight:600;backdrop-filter:blur(10px);align-items:center;gap:8px;';
    document.documentElement.appendChild(hudBadge);
  }

  function removeOverlay() {
    if (overlayCanvas) {
      overlayCanvas.remove();
      overlayCanvas = null;
      overlayCtx = null;
    }
    if (hudBadge) {
      hudBadge.remove();
      hudBadge = null;
    }
    points = [];
    gestureDirections = [];
  }

  function drawTrail() {
    if (!overlayCtx || points.length < 2) return;
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Glowing neon cyan/amber trail
    overlayCtx.lineWidth = 4;
    overlayCtx.lineCap = 'round';
    overlayCtx.lineJoin = 'round';
    overlayCtx.strokeStyle = '#06b6d4';
    overlayCtx.shadowColor = '#06b6d4';
    overlayCtx.shadowBlur = 12;

    overlayCtx.beginPath();
    overlayCtx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i++) {
      overlayCtx.lineTo(points[i].x, points[i].y);
    }
    overlayCtx.stroke();
  }

  function detectDirection(p1, p2) {
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 28) return null;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'R' : 'L';
    } else {
      return dy > 0 ? 'D' : 'U';
    }
  }

  window.addEventListener('mousedown', function(e) {
    if (e.button === 2) { // Right click
      isMouseDown = true;
      startX = e.clientX;
      startY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      points = [{ x: startX, y: startY }];
      isGesture = false;
      gestureDirections = [];
    }
  }, true);

  window.addEventListener('mousemove', function(e) {
    if (!isMouseDown) return;

    var curX = e.clientX;
    var curY = e.clientY;
    var totalDist = Math.sqrt(Math.pow(curX - startX, 2) + Math.pow(curY - startY, 2));

    if (totalDist > 14) {
      if (!isGesture) {
        isGesture = true;
        createOverlay();
      }

      points.push({ x: curX, y: curY });
      if (points.length > 50) points.shift();

      var dir = detectDirection({ x: lastX, y: lastY }, { x: curX, y: curY });
      if (dir) {
        if (gestureDirections.length === 0 || gestureDirections[gestureDirections.length - 1] !== dir) {
          gestureDirections.push(dir);
        }
        lastX = curX;
        lastY = curY;
      }

      drawTrail();

      // Update HUD badge
      if (hudBadge) {
        var key = gestureDirections.join('');
        var match = GESTURE_MAP[key];
        if (match) {
          hudBadge.style.display = 'flex';
          hudBadge.style.left = (curX + 18) + 'px';
          hudBadge.style.top = (curY + 18) + 'px';
          hudBadge.innerHTML = '<span style="font-family:serif;font-size:16px;color:#f59e0b;font-weight:900;">' + match.rune + '</span> <span>' + match.name + '</span>';
        } else if (key) {
          hudBadge.style.display = 'flex';
          hudBadge.style.left = (curX + 18) + 'px';
          hudBadge.style.top = (curY + 18) + 'px';
          hudBadge.innerHTML = '<span style="color:#06b6d4;">Valkyrie Flight:</span> ' + key;
        }
      }
    }
  }, true);

  window.addEventListener('mouseup', function(e) {
    if (e.button === 2 && isMouseDown) {
      isMouseDown = false;
      if (isGesture) {
        var key = gestureDirections.join('');
        var match = GESTURE_MAP[key];
        if (match) {
          match.action();
        }
        removeOverlay();
      }
    }
  }, true);

  // Suppress context menu if a gesture was executed
  window.addEventListener('contextmenu', function(e) {
    if (isGesture) {
      e.preventDefault();
      e.stopPropagation();
      isGesture = false;
      return false;
    }
  }, true);


  // --- 2. VIM RUNIC KEY NAVIGATOR ---
  var vimModeActive = false;
  var vimKeyBadges = [];
  var vimInputBuffer = '';
  var HINTS = ['A','S','D','F','G','H','J','K','L','Q','W','E','R','T','Y','U','I','O','P','Z','X','C','V','B','N','M'];

  function generateHintCodes(count) {
    var codes = [];
    var letters = 'asdfghjklqwertyuiopzxcvbnm';
    if (count <= letters.length) {
      for (var i = 0; i < count; i++) {
        codes.push(letters[i].toUpperCase());
      }
    } else {
      for (var i = 0; i < letters.length && codes.length < count; i++) {
        for (var j = 0; j < letters.length && codes.length < count; j++) {
          codes.push((letters[i] + letters[j]).toUpperCase());
        }
      }
    }
    return codes;
  }

  function activateVimNavigator() {
    if (vimModeActive) return;
    vimModeActive = true;
    vimInputBuffer = '';

    var candidates = Array.from(document.querySelectorAll('a[href], button, input, select, textarea, [tabindex], [role="button"]'));
    var visibleTargets = [];

    var vh = window.innerHeight;
    var vw = window.innerWidth;

    for (var i = 0; i < candidates.length; i++) {
      var el = candidates[i];
      var rect = el.getBoundingClientRect();
      if (rect.width > 6 && rect.height > 6 && rect.top < vh && rect.bottom > 0 && rect.left < vw && rect.right > 0) {
        visibleTargets.push({ el: el, rect: rect });
        if (visibleTargets.length >= 200) break;
      }
    }

    if (visibleTargets.length === 0) {
      vimModeActive = false;
      return;
    }

    var codes = generateHintCodes(visibleTargets.length);

    var container = document.createElement('div');
    container.id = 'valkyrie-vim-container';
    container.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647;';

    vimKeyBadges = [];

    for (var i = 0; i < visibleTargets.length; i++) {
      var target = visibleTargets[i];
      var code = codes[i];

      var badge = document.createElement('div');
      badge.textContent = code;
      badge.style.cssText = 'position:absolute;left:' + Math.max(0, target.rect.left) + 'px;top:' + Math.max(0, target.rect.top) + 'px;background:rgba(245,158,11,0.95);color:#000;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;font-weight:900;line-height:1;padding:2px 4px;border-radius:4px;box-shadow:0 0 8px rgba(0,0,0,0.8),0 0 10px rgba(245,158,11,0.6);border:1px solid #fff;text-transform:uppercase;pointer-events:none;';

      container.appendChild(badge);
      vimKeyBadges.push({ code: code, el: target.el, badge: badge });
    }

    document.documentElement.appendChild(container);
  }

  function deactivateVimNavigator() {
    vimModeActive = false;
    vimInputBuffer = '';
    var container = document.getElementById('valkyrie-vim-container');
    if (container) container.remove();
    vimKeyBadges = [];
  }

  window.addEventListener('keydown', function(e) {
    var tag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toLowerCase() : '';
    var isInput = tag === 'input' || tag === 'textarea' || (document.activeElement && document.activeElement.isContentEditable);

    // Alt+F: Toggle Vim Navigation Mode
    if (e.altKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      e.stopPropagation();
      if (vimModeActive) {
        deactivateVimNavigator();
      } else {
        activateVimNavigator();
      }
      return;
    }

    if (vimModeActive) {
      if (e.key === 'Escape') {
        e.preventDefault();
        deactivateVimNavigator();
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        vimInputBuffer += e.key.toUpperCase();

        var exactMatch = vimKeyBadges.find(function(b) { return b.code === vimInputBuffer; });
        if (exactMatch) {
          deactivateVimNavigator();
          exactMatch.el.focus();
          if (typeof exactMatch.el.click === 'function') {
            exactMatch.el.click();
          }
          return;
        }

        // Highlight partial matches or filter
        var partialCount = 0;
        vimKeyBadges.forEach(function(b) {
          if (b.code.startsWith(vimInputBuffer)) {
            partialCount++;
            b.badge.style.background = 'rgba(6,182,212,0.95)';
            b.badge.style.color = '#fff';
          } else {
            b.badge.style.opacity = '0.2';
          }
        });

        if (partialCount === 0) {
          deactivateVimNavigator();
        }
      }
      return;
    }

    // Passive Vim Scrolling shortcuts when not focused on an input element
    if (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (e.key === 'j') {
        window.scrollBy({ top: 120, behavior: 'smooth' });
      } else if (e.key === 'k') {
        window.scrollBy({ top: -120, behavior: 'smooth' });
      } else if (e.key === 'd') {
        window.scrollBy({ top: window.innerHeight * 0.5, behavior: 'smooth' });
      } else if (e.key === 'u') {
        window.scrollBy({ top: -window.innerHeight * 0.5, behavior: 'smooth' });
      } else if (e.key === 'G') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }
  }, true);

  window.__activateVimNavigator = activateVimNavigator;
  window.__deactivateVimNavigator = deactivateVimNavigator;
})();
`;
