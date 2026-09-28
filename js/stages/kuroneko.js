// 05 KuroNeko — the parser.
//
// Three prepared scripts, no typing on any device. One renders; two are broken
// on purpose and are replaced by the diagnostic the validation pass prints.
//
// The validator is the half worth showing: a script that would break at runtime
// never loads at all, and that is what the visitor is handed the means to prove.
import { tr } from '../i18n.js';
import { SCRIPTS, diagnose, render, parse } from './data/kn-script.js';

export const id = 'kuroneko';

let els = null;
let ctx = null;
let current = null;

function paintScript(source, problems) {
  const bad = new Map(problems.map((p) => [p.line, p]));
  els.script.replaceChildren();
  parse(source).forEach((line) => {
    const el = document.createElement('span');
    el.className = `kn-line${bad.has(line.line) ? ' is-bad' : ''}`;
    el.dataset.line = String(line.line);
    el.textContent = line.raw;
    els.script.append(el);
  });
}

function paintBox(beats) {
  const say = beats.filter((b) => b.text);
  const first = say[0];
  els.name.textContent = first?.speaker ?? '';
  els.text.textContent = first?.text ?? '';
  els.choices.replaceChildren();
  for (const option of beats.filter((b) => b.option)) {
    const li = document.createElement('li');
    li.textContent = option.option;
    els.choices.append(li);
  }
  els.box.classList.remove('is-error');
  els.error.replaceChildren();
}

function paintError(problems) {
  els.box.classList.add('is-error');
  els.name.textContent = '';
  els.text.textContent = '';
  els.choices.replaceChildren();
  els.error.replaceChildren();
  const head = document.createElement('p');
  head.className = 'kn-error-head';
  head.textContent = tr('kn.game.refused');
  els.error.append(head);
  for (const problem of problems) {
    const line = document.createElement('p');
    line.className = 'kn-error-line';
    line.textContent = problem.message;
    els.error.append(line);
  }
}

function pick(script, button) {
  current = script.id;
  for (const b of els.buttons) b.setAttribute('aria-pressed', String(b === button));

  const problems = diagnose(script.source);
  paintScript(script.source, problems);

  if (problems.length) {
    paintError(problems);
    ctx.complete(); // breaking it is the lesson
  } else {
    paintBox(render(script.source));
  }
}

export function mount(root, context) {
  ctx = context;
  current = null;

  const buttons = SCRIPTS.map((s) => `
    <button class="kn-pick" type="button" data-id="${s.id}" aria-pressed="false">
      ${tr(`kn.game.pick.${s.id}`)}
    </button>`).join('');

  root.innerHTML = `
    <div class="kn">
      <p class="game-hint">${tr('kn.game.hint')}</p>
      <div class="kn-picks">${buttons}</div>
      <div class="kn-box">
        <p class="kn-name"></p>
        <p class="kn-text"></p>
        <ul class="kn-choices"></ul>
        <div class="kn-error" aria-live="polite"></div>
      </div>
      <pre class="kn-script" aria-label="${tr('kn.game.scriptlabel')}"></pre>
    </div>`;

  els = {
    buttons: [...root.querySelectorAll('.kn-pick')],
    box: root.querySelector('.kn-box'),
    name: root.querySelector('.kn-name'),
    text: root.querySelector('.kn-text'),
    choices: root.querySelector('.kn-choices'),
    error: root.querySelector('.kn-error'),
    script: root.querySelector('.kn-script'),
  };

  els.buttons.forEach((button, i) => {
    button.addEventListener('click', () => pick(SCRIPTS[i], button));
  });

  // Open on the one that works, so the language is seen before it is broken.
  pick(SCRIPTS[0], els.buttons[0]);
}

export function unmount() {
  els = null;
  ctx = null;
  current = null;
}
