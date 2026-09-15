export const copy = {
  en: {
    'hero.role': 'Gameplay & Systems Programmer',
    'hero.summary': 'I build the systems players actually touch — combat, movement, dialogue, UI — and the simulation underneath them. One title shipped on Steam, one in production, and a demo you can play at BGS 2026.',
    'hero.cv': 'Download CV',
    'hero.scroll': 'Scroll',

    'positioning.heading': 'What I do',
    'positioning.body': 'I work on gameplay: the code between an input and a response that feels right — combat state machines, damage and knockback, dialogue parsing, UI flow, the audio hooks that sell an impact. And the systems under it: a deterministic race simulator with no engine dependency, a narrative parser that validates its own script, test harnesses that run without opening the editor. Unity and Unreal Engine 5, in C#, C++ and Blueprints.',

    'sv.title': 'Steam Veins',
    'sv.status': 'Released on Steam · Aug 2025 · Kimu Studios',
    'sv.lede': 'A 2D action roguelike from Kimu Studios, released on Steam in Early Access. I owned enemy combat: how enemies take damage, react, change phase and die.',
    'sv.b1': 'Enemy damage response — invulnerability frames, knockback, collision handling',
    'sv.b2': 'Phase transitions driven by health thresholds',
    'sv.b3': 'FMOD event integration with randomised pitch on melee hits',
    'sv.b4': 'Visual effects integration and performance passes',

    'mm.title': 'MidNight Memories',
    'mm.status': 'BGS 2026 booth demo · Two-person team, code lead',
    'mm.lede': 'A PSX-style first-person horror built in Unity. Chapter One is a 10–12 minute demo I designed and built for the Brasil Game Show booth: one route, one puzzle, one boss, and a story that is never explained out loud.',
    'mm.b1': 'Investigation Mode: objects, clocks and the distant tower become readable only through the visor — and the clock puzzle is solved with it, at range',
    'mm.b2': 'Fog-gated combat arenas, Nightmare AI that chases or waits, and the Obsidian Wraith boss with two attacks',
    'mm.b3': 'Item log, ammo count, and a floor-plan map the player has to earn',
    'mm.b4': 'Generated streets and facades; a demo flow that resets cleanly between booth players',
    'mm.b5': 'Game-logic core covered by 103 unit tests',

    'fd.title': 'Framed Drift',
    'fd.status': 'Solo · Unity 6 · In development',
    'fd.lede': "An idle drift RPG for PC. The player doesn't drive — they build the car, pick the track and the risk, and watch it run. Underneath is a race simulator that resolves the whole race at once, deterministic and independent of Unity.",
    'fd.b1': 'Pure C# simulation assembly with no engine references — 10,000 races resolve in 0.06 s, and the tests run in dotnet without opening the editor',
    'fd.b2': 'Offline progress uses the same scorer as live play: parity measured at 0.06 %',
    'fd.b3': "135 automated tests written as the GDD's exit criteria — win rates, cash curve, presence uplift, failure rate",
    'fd.b4': 'All content as commented JSON: 11 tracks, 57 parts, 12 affixes, 5 rivals — each rival a readable, counterable build',
    'fd.b5': 'Procedural track generator, validated 200 of 200',

    'hk.title': "Hell's Kitchen",
    'hk.status': 'Independent team · Unity 6 · In development',
    'hk.lede': "A tower defense where the map grows as you clear it: a 4×4 grid of rooms, each claimed and fortified, a boss every third room and one at the end. I write the gameplay systems on top of the team's design document.",
    'hk.b1': 'Damage types — physical, magic, true, area — against per-enemy armour and resistance',
    'hk.b2': 'Four-level towers: stats, then a speciality choice, then a chef special on a cooldown',
    'hk.b3': "Status effects that pierce, split and slow to a root; blocker squads that hold the path; flying enemies out of ground towers' reach",
    'hk.b4': 'Ingredient drops into a typed pantry that funds upgrades',
    'hk.b5': 'Batch-mode smoke harness that plays all 16 rooms headless and asserts the run',

    'kn.title': 'KuroNeko',
    'kn.status': 'Visual novel · Solo project',
    'kn.lede': 'A visual novel built solo in Unity, driven by a narrative parser I wrote: script in, branching scene out.',
    'kn.b1': 'Ten-command script language — scenes, characters, audio, flags, conditionals, jumps, menus — with inline parameters anywhere in a line',
    'kn.b2': 'A diagnostic pass validates the whole script at load: unknown commands, duplicate labels, dead jumps, empty menus',
    'kn.b3': 'Parser has no Unity dependency; the engine layer handles scene, UI and save slots',

    'dg.title': 'Dino Girls',
    'dg.status': 'In production · Kimu Studios · Gameplay programmer',
    'dg.lede': "An idle resort-builder coming to Steam from Kimu Studios. I'm on the gameplay team: systems and mechanics, and the technical calls that come with them.",
    'dg.b1': 'Gameplay systems and mechanics implementation',
    'dg.b2': 'Technical and creative decision-making with the team',

    'craft.heading': 'Art and assets',
    'craft.body': 'Backgrounds, sprite sheets and scene work produced alongside the code.',

    'code.heading': 'Code',
    'code.caption': 'Enemy damage response from Steam Veins — invulnerability gate, FMOD audio, health-threshold phase change, and execution state. C#, Unity.',
    'code.caption2': 'Drift scoring from Framed Drift — the same scorer runs the live race and the offline one, so offline parity is structural rather than tested. Pure C#, no UnityEngine.',
    'code.link': 'More on GitHub',

    'bg.heading': 'Background',
    'bg.degree': "Bachelor's, Information Technology — UFRN",
    'bg.gamedesign': 'Game Design — Udemy',
    'bg.database': 'Database Administration — IFRS',

    'contact.heading': 'Get in touch',
    'contact.body': 'Open to gameplay and systems programming roles. Find me at BGS 2026.',
    'contact.cv': 'Download CV',

    'nav.steam': 'Steam page',
    'nav.demo': 'Demo',
    'nav.project': 'View project',
  },

  pt: {
    'hero.role': 'Programador de Gameplay e Sistemas',
    'hero.summary': 'Construo os sistemas que o jogador realmente toca — combate, movimentação, diálogo, UI — e a simulação por baixo deles. Um título publicado na Steam, um em produção e uma demo jogável na BGS 2026.',
    'hero.cv': 'Baixar CV',
    'hero.scroll': 'Role',

    'positioning.heading': 'O que eu faço',
    'positioning.body': 'Trabalho com gameplay: o código entre um input e uma resposta que parece certa — máquinas de estado de combate, dano e knockback, parsing de diálogo, fluxo de UI, os hooks de áudio que vendem o impacto. E os sistemas por baixo: um simulador de corrida determinístico sem dependência da engine, um parser narrativo que valida o próprio roteiro, harnesses de teste que rodam sem abrir o editor. Unity e Unreal Engine 5, em C#, C++ e Blueprints.',

    'sv.title': 'Steam Veins',
    'sv.status': 'Lançado na Steam · Ago 2025 · Kimu Studios',
    'sv.lede': 'Roguelike de ação 2D da Kimu Studios, lançado na Steam em Acesso Antecipado. Fui responsável pelo combate dos inimigos: como eles tomam dano, reagem, mudam de fase e morrem.',
    'sv.b1': 'Resposta a dano dos inimigos — frames de invulnerabilidade, knockback, tratamento de colisão',
    'sv.b2': 'Transições de fase acionadas por limiares de vida',
    'sv.b3': 'Integração de eventos FMOD com pitch aleatório nos golpes corpo a corpo',
    'sv.b4': 'Integração de efeitos visuais e otimização de performance',

    'mm.title': 'MidNight Memories',
    'mm.status': 'Demo de estande na BGS 2026 · Dupla, lidero o código',
    'mm.lede': 'Horror em primeira pessoa no estilo PSX, feito em Unity. O Capítulo Um é uma demo de 10 a 12 minutos que desenhei e construí para o estande da Brasil Game Show: uma rota, um puzzle, um chefe e uma história que nunca é explicada em voz alta.',
    'mm.b1': 'Modo Investigação: objetos, relógios e a torre ao longe só ficam legíveis pelo visor — e o puzzle dos relógios é resolvido com ele, à distância',
    'mm.b2': 'Arenas de combate seladas por névoa, IA dos Pesadelos que persegue ou espera, e o chefe Obsidian Wraith com dois ataques',
    'mm.b3': 'Registro de itens, contagem de munição e um mapa da área que o jogador precisa conquistar',
    'mm.b4': 'Ruas e fachadas geradas; um fluxo de demo que reinicia limpo entre um jogador e outro no estande',
    'mm.b5': 'Núcleo de lógica do jogo coberto por 103 testes unitários',

    'fd.title': 'Framed Drift',
    'fd.status': 'Solo · Unity 6 · Em desenvolvimento',
    'fd.lede': 'RPG incremental de drift para PC. O jogador não pilota — monta o carro, escolhe a pista e o risco, e assiste o carro correr. Por baixo há um simulador que resolve a corrida inteira de uma vez, determinístico e independente do Unity.',
    'fd.b1': 'Assembly de simulação em C# puro, sem referências à engine — 10.000 corridas resolvem em 0,06 s e os testes rodam em dotnet sem abrir o editor',
    'fd.b2': 'O progresso offline usa o mesmo scorer do jogo ao vivo: paridade medida em 0,06 %',
    'fd.b3': '135 testes automatizados escritos como os critérios de saída do GDD — taxa de vitória, curva de cash, uplift por presença, taxa de falha',
    'fd.b4': 'Todo o conteúdo em JSON comentado: 11 pistas, 57 peças, 12 afixos, 5 rivais — cada rival com uma build legível e contra-atacável',
    'fd.b5': 'Gerador procedural de pistas, validado em 200 de 200',

    'hk.title': "Hell's Kitchen",
    'hk.status': 'Equipe independente · Unity 6 · Em desenvolvimento',
    'hk.lede': 'Tower defense em que o mapa cresce conforme você o limpa: uma grade 4×4 de salas, cada uma conquistada e fortificada, um chefe a cada três salas e um no fim. Escrevo os sistemas de gameplay em cima do documento de design da equipe.',
    'hk.b1': 'Tipos de dano — físico, mágico, verdadeiro, em área — contra armadura e resistência por inimigo',
    'hk.b2': 'Torres de quatro níveis: atributos, depois uma escolha de especialidade, depois um especial do chef com recarga',
    'hk.b3': 'Efeitos de status que perfuram, dividem e desaceleram até enraizar; esquadrões bloqueadores que seguram o caminho; inimigos voadores fora do alcance das torres terrestres',
    'hk.b4': 'Ingredientes dropados em uma despensa tipada que financia as melhorias',
    'hk.b5': 'Harness de smoke test em batch que joga as 16 salas sem tela e verifica a run',

    'kn.title': 'KuroNeko',
    'kn.status': 'Visual novel · Projeto solo',
    'kn.lede': 'Visual novel feita solo em Unity, movida por um parser narrativo que escrevi: roteiro na entrada, cena ramificada na saída.',
    'kn.b1': 'Linguagem de roteiro com dez comandos — cenas, personagens, áudio, flags, condicionais, saltos, menus — com parâmetros inline em qualquer ponto da linha',
    'kn.b2': 'Um passe de diagnóstico valida o roteiro inteiro ao carregar: comandos desconhecidos, labels duplicados, saltos mortos, menus vazios',
    'kn.b3': 'O parser não depende do Unity; a camada de engine cuida de cena, UI e slots de save',

    'dg.title': 'Dino Girls',
    'dg.status': 'Em produção · Kimu Studios · Programador de gameplay',
    'dg.lede': 'Idle game de construção de resort a caminho da Steam pela Kimu Studios. Estou na equipe de gameplay: sistemas e mecânicas, e as decisões técnicas que vêm com eles.',
    'dg.b1': 'Implementação de sistemas de gameplay e mecânicas',
    'dg.b2': 'Decisões técnicas e criativas junto à equipe',

    'craft.heading': 'Arte e assets',
    'craft.body': 'Cenários, sprite sheets e trabalho de cena produzidos junto com o código.',

    'code.heading': 'Código',
    'code.caption': 'Resposta a dano de inimigo em Steam Veins — verificação de invulnerabilidade, áudio FMOD, mudança de fase por limiar de vida e estado de execução. C#, Unity.',
    'code.caption2': 'Pontuação de drift em Framed Drift — o mesmo scorer roda a corrida ao vivo e a offline, então a paridade offline é estrutural, não testada. C# puro, sem UnityEngine.',
    'code.link': 'Mais no GitHub',

    'bg.heading': 'Formação',
    'bg.degree': 'Bacharelado em Tecnologia da Informação — UFRN',
    'bg.gamedesign': 'Game Design — Udemy',
    'bg.database': 'Administração de Banco de Dados — IFRS',

    'contact.heading': 'Contato',
    'contact.body': 'Aberto a vagas de programação de gameplay e sistemas. Me encontre na BGS 2026.',
    'contact.cv': 'Baixar CV',

    'nav.steam': 'Página na Steam',
    'nav.demo': 'Demo',
    'nav.project': 'Ver projeto',
  },
};

const STORAGE_KEY = 'lang';
let active = 'en';

export function currentLang() {
  return active;
}

function resolveInitial() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'pt') return stored;
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

function apply(lang) {
  const dict = copy[lang];
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const key = el.dataset.i18n;
    const value = dict[key];
    if (value === undefined) {
      console.warn(`i18n: no "${lang}" entry for key "${key}"`);
      continue; // leave existing text rather than rendering undefined
    }
    el.textContent = value;
  }
  document.documentElement.lang = lang;
  active = lang;
  localStorage.setItem(STORAGE_KEY, lang);

  for (const btn of document.querySelectorAll('[data-lang]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
  }
}

export function initI18n() {
  for (const btn of document.querySelectorAll('[data-lang]')) {
    btn.addEventListener('click', () => apply(btn.dataset.lang));
  }
  apply(resolveInitial());

  // Only offered once binding has succeeded; without JS the toggle cannot work,
  // so css/components.css ships it hidden.
  const switcher = document.querySelector('.lang');
  if (switcher) switcher.style.display = 'flex';
}
