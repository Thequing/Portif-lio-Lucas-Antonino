// KuroNeko — the script language and its validation pass.
//
// ready === false: the command names and the diagnostic strings below are a
// STAND-IN modelled on the stage copy ("ten commands — scenes, characters,
// audio, flags, conditionals, jumps, menus — with inline parameters anywhere in
// a line"; "a diagnostic pass validates the whole script at load: unknown
// commands, duplicate labels, dead jumps, empty menus"). The real parser prints
// its own messages, and showing invented ones would misrepresent the tool.
// arcade.js does not render this stage's launcher while ready is false.
//
// To make it real: replace COMMANDS, the diagnostic strings and SCRIPTS with the
// parser's own, and flip ready. kuroneko.test.mjs covers all four diagnostic
// classes, so a bad transcription fails the suite.
export const ready = false;

export const COMMANDS = [
  'scene', 'char', 'say', 'audio', 'flag',
  'if', 'jump', 'label', 'menu', 'end',
];

// A line is `command param param ... "text"`, parameters inline anywhere.
function parseLine(raw, index) {
  const text = raw.trim();
  if (!text || text.startsWith('#')) return null;
  const quoted = text.match(/"([^"]*)"/);
  const head = (quoted ? text.slice(0, quoted.index) : text).trim().split(/\s+/);
  return {
    line: index + 1,
    command: head[0],
    args: head.slice(1),
    text: quoted ? quoted[1] : null,
    raw: text,
  };
}

export function parse(source) {
  return String(source).split('\n').map(parseLine).filter(Boolean);
}

// The validation pass: one sweep for the whole script, before anything renders.
// Returns [] for a clean script.
export function diagnose(source) {
  const lines = parse(source);
  const problems = [];
  const labels = new Map();

  for (const l of lines) {
    if (!COMMANDS.includes(l.command)) {
      problems.push({ kind: 'unknown-command', line: l.line, token: l.command,
        message: `line ${l.line}: unknown command '${l.command}'` });
      continue;
    }
    if (l.command === 'label') {
      const name = l.args[0];
      if (labels.has(name)) {
        problems.push({ kind: 'duplicate-label', line: l.line, token: name,
          message: `line ${l.line}: duplicate label '${name}', first defined on line ${labels.get(name)}` });
      } else {
        labels.set(name, l.line);
      }
    }
  }

  for (const l of lines) {
    if (l.command === 'jump') {
      const target = l.args[0];
      if (!labels.has(target)) {
        problems.push({ kind: 'dead-jump', line: l.line, token: target,
          message: `line ${l.line}: dead jump, label '${target}' is never defined` });
      }
    }
    if (l.command === 'menu') {
      // A menu's options are the indented lines that follow it.
      const own = lines.filter((o) => o.line > l.line);
      const next = own.find((o) => o.command !== 'jump' || !o.text);
      const options = own
        .slice(0, next ? own.indexOf(next) : own.length)
        .filter((o) => o.text);
      if (options.length === 0) {
        problems.push({ kind: 'empty-menu', line: l.line, token: l.args[0] ?? 'menu',
          message: `line ${l.line}: menu has no options` });
      }
    }
  }

  return problems.sort((a, b) => a.line - b.line);
}

// Renders a clean script to the beats the dialogue box shows. Only ever called
// on a script that diagnosed clean.
export function render(source) {
  const beats = [];
  let speaker = null;
  for (const l of parse(source)) {
    if (l.command === 'char') speaker = l.args[0];
    else if (l.command === 'say') beats.push({ speaker: l.args[0] ?? speaker, text: l.text });
    else if (l.command === 'scene') beats.push({ scene: l.args[0] });
    else if (l.command === 'menu') beats.push({ menu: true });
    else if (l.command === 'jump' && l.text) beats.push({ option: l.text, to: l.args[0] });
  }
  return beats;
}

// The three the cabinet offers. Two are broken on purpose: the validator is the
// half worth showing, so the visitor is given something to break.
export const SCRIPTS = [
  {
    id: 'works',
    broken: false,
    source: [
      'scene alley_night',
      'char Kuro',
      'say Kuro "You came back."',
      'menu',
      'jump apologise "Say you are sorry"',
      'jump deflect "Change the subject"',
      'label apologise',
      'say Kuro "...took you long enough."',
      'end',
      'label deflect',
      'say Kuro "Of course you did."',
      'end',
    ].join('\n'),
  },
  {
    id: 'dead-jump',
    broken: true,
    source: [
      'scene alley_night',
      'char Kuro',
      'say Kuro "You came back."',
      'menu',
      'jump apology "Say you are sorry"',
      'jump deflect "Change the subject"',
      'label apologise',
      'say Kuro "...took you long enough."',
      'end',
      'label deflect',
      'say Kuro "Of course you did."',
      'end',
    ].join('\n'),
  },
  {
    id: 'empty-menu',
    broken: true,
    source: [
      'scene alley_night',
      'char Kuro',
      'say Kuro "You came back."',
      'menu',
      'end',
    ].join('\n'),
  },
];
