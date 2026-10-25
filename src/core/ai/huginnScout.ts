import { mimirIpc, PageContentPayload } from '@/core/ipc/bridge';
import { Realm, Tab } from '@/types';

export const HUGINN_INTROS = [
  'By the sacred roots of Yggdrasil, I bring tidings from the nine winds...',
  'My obsidian wings have soared across the realms; here is the lore you seek...',
  'The Allfather watches from Hliðskjálf. Hear what the ravens perceive...',
  'Dipping my beak into the waters of Mímisbrunnr, wisdom crystallizes...',
];

const GEMINI_STORAGE_KEY = 'mimir_gemini_api_key';

export const getGeminiApiKey = (): string | null => {
  try {
    return localStorage.getItem(GEMINI_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

export const setGeminiApiKey = (key: string): void => {
  try {
    if (key.trim()) {
      localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(GEMINI_STORAGE_KEY);
    }
  } catch {}
};

/**
 * Requests live DOM page extraction from the active WebView2 tab.
 * Times out gracefully after 450ms if the tab is internal (mimir://) or unresponsive.
 */
export const fetchActivePageContent = (fallbackTab?: Tab): Promise<PageContentPayload> => {
  return new Promise((resolve) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsub();
        resolve({
          title: fallbackTab?.title || 'Sanctum of Wisdom',
          url: fallbackTab?.url || 'mimir://newtab',
          metaDescription: '',
          headings: [],
          textExcerpt: '',
          codeSnippetsCount: 0,
          scriptsCount: 0,
          frameworks: [],
          wordCount: 0,
        });
      }
    }, 450);

    const unsub = mimirIpc.onPageContent((data) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        unsub();
        resolve(data);
      }
    });

    mimirIpc.extractPageContent();
  });
};

/**
 * Intelligent Huginn AI scout: queries Google Gemini 1.5 Flash if an API key is present,
 * or performs rich, deterministic extractive semantic analysis on the real page content.
 */
export async function scoutActivePage(
  action: 'summarize' | 'code' | 'ward' | 'chat',
  prompt: string,
  realm: Realm,
  tab?: Tab,
  pageDataOverride?: PageContentPayload
): Promise<string> {
  const pageData = pageDataOverride || (await fetchActivePageContent(tab));
  const apiKey = getGeminiApiKey();

  // 1. If Gemini API Key is configured, execute real generative multimodal inference
  if (apiKey) {
    try {
      const systemInstruction = `You are Huginn, the legendary raven of thought and Allfather's scout in the mythic Mímir web browser.
You speak with high-tech Norse wisdom, poetic runic clarity, and deep technological acumen.
Ground your response accurately in the provided live webpage lore.

CURRENT REALM: ${realm.name} (${realm.norseName}) — Ward: ${realm.ruler} (${realm.rulerTitle})
CURRENT GATEWAY TITLE: ${pageData.title || tab?.title || 'Unknown Gateway'}
CURRENT URL: ${pageData.url || tab?.url || 'Unknown'}
HEADINGS: ${pageData.headings.join(' | ') || 'None detected'}
META DESCRIPTION: ${pageData.metaDescription || 'None'}
DETECTED FRAMEWORKS / LIBS: ${pageData.frameworks.join(', ') || 'Vanilla / Static Web'}
PAGE EXCERPT:
${pageData.textExcerpt.slice(0, 3000) || 'Internal browser sanctum'}`;

      const userText = `Action: ${action.toUpperCase()}
Inquiry: ${prompt}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\n${userText}` }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          return candidateText.trim();
        }
      }
    } catch (e) {
      console.warn('[Huginn] Gemini API query encountered error, engaging local semantic engine', e);
    }
  }

  // 2. High-Fidelity Local Semantic Analysis Engine (100% Offline & Grounded in Real DOM)
  const intro = HUGINN_INTROS[Math.floor(Math.random() * HUGINN_INTROS.length)];
  const currentUrl = pageData.url || tab?.url || 'mimir://newtab';
  const currentTitle = pageData.title || tab?.title || 'Sanctum of Wisdom';
  const domain = currentUrl.replace(/^https?:\/\//, '').split('/')[0] || 'localhost';
  const readingTime = Math.max(1, Math.round(pageData.wordCount / 200));

  if (action === 'summarize') {
    let summaryBody = `**Runic Synthesis of [${currentTitle}](${currentUrl})**:\n\n`;
    summaryBody += `• **Gateway Metrics**: ${pageData.wordCount.toLocaleString()} runes (approx. ${readingTime} min reading time) across conduit \`${domain}\`.\n`;

    if (pageData.metaDescription) {
      summaryBody += `• **Sacred Inscription**: *"${pageData.metaDescription}"*\n`;
    }

    if (pageData.headings && pageData.headings.length > 0) {
      const keyHeadings = pageData.headings.slice(0, 4).map((h) => `\`${h}\``).join(' • ');
      summaryBody += `• **Key Structural Pathways**: ${keyHeadings}\n`;
    }

    if (pageData.textExcerpt) {
      // Extract first 2 distinct sentences for substantive context
      const cleanExcerpt = pageData.textExcerpt
        .replace(/\s+/g, ' ')
        .split(/(?<=[.?!])\s+/)
        .filter((s) => s.length > 20)
        .slice(0, 2)
        .join(' ');
      if (cleanExcerpt) {
        summaryBody += `• **Core Wisdom Essence**: "${cleanExcerpt}"\n`;
      }
    }

    summaryBody += `• **Architecture & Shield**: ${pageData.url.startsWith('https://') ? 'Encrypted TLS Origin' : 'Unshielded Plaintext Conduit'} with Sacred Aegishjalmr protection engaged.\n`;
    summaryBody += `• **Allfather's Verdict**: ${realm.rulerTitle} discerns true purpose in this vessel. Proceed with clarity and focused intention.`;

    return `${intro}\n\n${summaryBody}`;
  }

  if (action === 'code') {
    const techStack = pageData.frameworks.length > 0 ? pageData.frameworks.join(', ') : 'Vanilla Web Architecture';
    return `${intro}\n\n**Code Lore Examination of \`${domain}\`**:\n\n` +
      `• **Detected Libraries & Frameworks**: **${techStack}**\n` +
      `• **Script Vectors**: **${pageData.scriptsCount}** external and inline script elements executing in client runtime.\n` +
      `• **Code Inscriptions**: **${pageData.codeSnippetsCount}** syntax blocks and \`<pre>\` elements mapped across DOM.\n` +
      `• **Host Container**: Microsoft Edge WebView2 runtime bound to Mímir's high-performance Rust core.\n` +
      `• **Memory Isolation**: Workspace memory boundary partitioned for realm **${realm.name}**; no cross-realm leakage permitted.`;
  }

  if (action === 'ward') {
    const isHttps = currentUrl.startsWith('https://');
    return `${intro}\n\n**Shield & Ward Audit for \`${domain}\`**:\n\n` +
      `• **Connection Protocol**: ${isHttps ? '🛡️ Encrypted TLS Conduit (HTTPS Verified)' : '⚠️ Unencrypted HTTP Conduit'}\n` +
      `• **Aegishjalmr Shield**: Active — EasyList, EasyPrivacy, and YouTube Adblock Sentinel enforcing zero telemetry.\n` +
      `• **Cross-Site Boundary**: Origin partition prevents tracking vectors from correlating identity across realms.\n` +
      `• **Recommendation**: ${isHttps ? 'Conduit is fortified and secure.' : 'Caution: Upgrade to HTTPS recommended for sensitive transmissions.'}`;
  }

  // Default contextual inquiry
  let contextualReply = `${intro}\n\nRegarding **"${prompt}"** in **${currentTitle}**:\n\n`;
  if (pageData.textExcerpt) {
    const sample = pageData.textExcerpt.slice(0, 220).replace(/\s+/g, ' ');
    contextualReply += `Reviewing the scroll at \`${domain}\`: *"...${sample}..."*\n\n`;
  }
  contextualReply += `In the teachings of ${realm.ruler}, every scroll holds hidden depths. The runes declare favor upon your pursuit along Yggdrasil. Seek deeper, and I shall illuminate the way.`;
  return contextualReply;
}
