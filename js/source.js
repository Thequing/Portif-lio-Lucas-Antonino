// The source viewer: a tab strip over the two files, and C# highlighting.
//
// Highlighting runs here rather than being baked into the markup so a sample
// can be swapped by pasting plain code into index.html. It is a line-at-a-time
// tokenizer, not a parser — enough for display snippets, which is all it sees.
// Without JS the code is plain and every file shows.

const KEYWORDS = new Set(('abstract as async await base bool break case catch class const continue default ' +
  'do double else enum event false float for foreach if in int internal is long new null out override ' +
  'private protected public readonly ref return sealed static string struct switch this throw true try ' +
  'var virtual void while').split(' '));

// Comments, strings, numbers, identifiers; everything else passes through.
const TOKEN = /(\/\/.*$)|("(?:\\.|[^"\\])*")|(\b\d+(?:\.\d+)?[fdLm]?\b)|([A-Za-z_]\w*)/g;

function highlightLine(line) {
  const text = line.textContent;
  if (!text.trim()) return;
  const out = document.createDocumentFragment();
  let last = 0;
  const span = (cls, s) => {
    const el = document.createElement('span');
    el.className = cls;
    el.textContent = s;
    return el;
  };
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.append(text.slice(last, m.index));
    const [tok, comment, string, number, word] = m;
    const next = text.slice(m.index + tok.length).trimStart();
    if (comment) out.append(span('tk-comment', tok));
    else if (string) out.append(span('tk-string', tok));
    else if (number) out.append(span('tk-number', tok));
    else if (KEYWORDS.has(word)) out.append(span('tk-keyword', tok));
    // "Get<T>(" is a generic call; "hp <= max" is a comparison.
    else if (next.startsWith('(') || /^<[A-Z]/.test(next)) out.append(span('tk-call', tok));
    // PascalCase after a dot is a member (timeline.Length), not a type.
    else if (/^[A-Z]/.test(word) && text[m.index - 1] !== '.') out.append(span('tk-type', tok));
    else out.append(tok);
    last = m.index + tok.length;
  }
  if (last < text.length) out.append(text.slice(last));
  line.replaceChildren(out);
}

function tabs(viewer) {
  const list = viewer.querySelector('[role="tablist"]');
  const tabEls = [...viewer.querySelectorAll('[role="tab"]')];
  if (!list || !tabEls.length) return;
  viewer.classList.add('is-tabbed');

  function select(tab, focus) {
    for (const other of tabEls) {
      const on = other === tab;
      other.setAttribute('aria-selected', String(on));
      other.tabIndex = on ? 0 : -1;
      document.getElementById(other.getAttribute('aria-controls'))?.classList.toggle('is-active', on);
    }
    if (focus) tab.focus();
  }

  for (const tab of tabEls) tab.addEventListener('click', () => select(tab, false));
  // Arrow keys move between tabs, per the WAI-ARIA tabs pattern.
  list.addEventListener('keydown', (e) => {
    const i = tabEls.indexOf(document.activeElement);
    if (i < 0) return;
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % tabEls.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + tabEls.length) % tabEls.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = tabEls.length - 1;
    if (j === null) return;
    e.preventDefault();
    select(tabEls[j], true);
  });
}

export function initSource() {
  for (const line of document.querySelectorAll('#source .code .line')) highlightLine(line);
  for (const viewer of document.querySelectorAll('#source .viewer')) tabs(viewer);
}
