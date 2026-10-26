import { RealmId } from '@/types';

/**
 * Converts HTML content or article excerpts into clean, readable GitHub Flavored Markdown.
 */
export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  if (typeof DOMParser === 'undefined') {
    // Basic fallback for non-DOM environments
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]+>/g, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Strip scripts, styles, meta, iframes, forms, noscript
  const unneeded = doc.querySelectorAll('script, style, iframe, form, noscript, svg, button, input');
  unneeded.forEach((el) => el.remove());

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const childMarkdown = Array.from(el.childNodes).map(processNode).join('');

    switch (tag) {
      case 'h1':
        return `\n\n# ${childMarkdown.trim()}\n\n`;
      case 'h2':
        return `\n\n## ${childMarkdown.trim()}\n\n`;
      case 'h3':
        return `\n\n### ${childMarkdown.trim()}\n\n`;
      case 'h4':
        return `\n\n#### ${childMarkdown.trim()}\n\n`;
      case 'h5':
        return `\n\n##### ${childMarkdown.trim()}\n\n`;
      case 'h6':
        return `\n\n###### ${childMarkdown.trim()}\n\n`;
      case 'p':
        return `\n\n${childMarkdown.trim()}\n\n`;
      case 'strong':
      case 'b':
        return `**${childMarkdown}**`;
      case 'em':
      case 'i':
        return `*${childMarkdown}*`;
      case 'pre': {
        const codeText = el.textContent || '';
        return `\n\n\`\`\`\n${codeText.trim()}\n\`\`\`\n\n`;
      }
      case 'code':
        return `\`${childMarkdown}\``;
      case 'blockquote':
        return `\n\n> ${childMarkdown.trim().replace(/\n/g, '\n> ')}\n\n`;
      case 'ul':
        return `\n\n${childMarkdown}\n\n`;
      case 'ol':
        return `\n\n${childMarkdown}\n\n`;
      case 'li': {
        const parentTag = el.parentElement?.tagName.toLowerCase();
        if (parentTag === 'ol') {
          const index = Array.from(el.parentElement?.children || []).indexOf(el) + 1;
          return `${index}. ${childMarkdown.trim()}\n`;
        }
        return `- ${childMarkdown.trim()}\n`;
      }
      case 'a': {
        const href = el.getAttribute('href');
        if (!href || href.startsWith('javascript:')) return childMarkdown;
        return `[${childMarkdown.trim() || href}](${href})`;
      }
      case 'img': {
        const src = el.getAttribute('src');
        const alt = el.getAttribute('alt') || 'Clipped artifact';
        if (!src) return '';
        return `![${alt}](${src})`;
      }
      case 'hr':
        return '\n\n---\n\n';
      case 'br':
        return '\n';
      case 'table':
        return `\n\n${childMarkdown.trim()}\n\n`;
      case 'thead':
      case 'tbody':
      case 'tr':
        return childMarkdown;
      case 'th':
      case 'td':
        return `| ${childMarkdown.trim()} `;
      default:
        return childMarkdown;
    }
  }

  const rawMd = processNode(doc.body);

  // Clean excessive empty lines and trailing spaces
  return rawMd
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * Prepares a full Markdown document with YAML Frontmatter for knowledge archiving.
 */
export function buildFrontmatterMarkdown(opts: {
  title: string;
  url: string;
  realm: RealmId;
  tags: string[];
  excerpt?: string;
  author?: string | null;
  body: string;
}): string {
  const dateStr = new Date().toISOString();
  const tagsFormatted = opts.tags.map((t) => `"${t.startsWith('#') ? t : '#' + t}"`).join(', ');

  const frontmatter = [
    '---',
    `title: "${opts.title.replace(/"/g, '\\"')}"`,
    `url: "${opts.url}"`,
    `date: "${dateStr}"`,
    `realm: "${opts.realm}"`,
    opts.author ? `author: "${opts.author.replace(/"/g, '\\"')}"` : null,
    `tags: [${tagsFormatted}]`,
    opts.excerpt ? `excerpt: "${opts.excerpt.slice(0, 200).replace(/"/g, '\\"')}"` : null,
    '---',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  return `${frontmatter}\n# ${opts.title}\n\n> Source: [${opts.url}](${opts.url})\n\n${opts.body.trim()}`;
}
