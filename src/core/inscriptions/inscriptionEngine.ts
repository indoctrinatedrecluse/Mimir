import { RealmId } from '@/types';
import { mimirIpc } from '@/core/ipc/bridge';
import { RunicInscription } from '@/components/forge/BrokkrForge';

export const inscriptionEngine = {
  getInscriptions: (): RunicInscription[] => {
    try {
      const saved = localStorage.getItem('mimir_brokkr_forge');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  },

  matchPattern: (pattern: string, url: string): boolean => {
    if (!pattern || pattern === '*://*/*' || pattern === '*') return true;
    try {
      const regexStr = '^' + pattern
        .replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&')
        .replace(/\\\*/g, '.*') + '$';
      return new RegExp(regexStr, 'i').test(url);
    } catch {
      return url.includes(pattern.replace(/\*/g, ''));
    }
  },

  applyInscriptionsForTab: (url: string, realm: RealmId): void => {
    if (!url || url.startsWith('mimir://')) return;

    const allInscriptions = inscriptionEngine.getInscriptions();
    const activeRules = allInscriptions.filter(
      (ins) => ins.enabled && (ins.realmFilter === 'all' || ins.realmFilter === realm) && inscriptionEngine.matchPattern(ins.matchPattern, url)
    );

    if (activeRules.length === 0) return;

    for (const rule of activeRules) {
      const script = `(() => {
        try {
          const styleId = "mimir-forge-${rule.id}";
          let styleEl = document.getElementById(styleId);
          if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = styleId;
            document.head ? document.head.appendChild(styleEl) : document.documentElement.appendChild(styleEl);
          }
          styleEl.textContent = ${JSON.stringify(rule.cssRules)};
          ${rule.jsRules ? rule.jsRules : ''}
        } catch(e) {
          console.warn("[Mímir Brokkr Forge] Inscription error:", e);
        }
      })();`;

      mimirIpc.send({
        type: 'EXECUTE_SCRIPT',
        payload: { script },
      });
    }
  },

  injectDirect: (rule: RunicInscription): void => {
    const script = `(() => {
      try {
        const styleId = "mimir-forge-${rule.id}";
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
          styleEl = document.createElement("style");
          styleEl.id = styleId;
          document.head ? document.head.appendChild(styleEl) : document.documentElement.appendChild(styleEl);
        }
        styleEl.textContent = ${JSON.stringify(rule.cssRules)};
        ${rule.jsRules ? rule.jsRules : ''}
      } catch(e) {
        console.warn("[Mímir Brokkr Forge] Inscription error:", e);
      }
    })();`;

    mimirIpc.send({
      type: 'EXECUTE_SCRIPT',
      payload: { script },
    });
  },
};
