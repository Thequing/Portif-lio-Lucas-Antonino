import { initI18n } from './i18n.js';
import { initMedia } from './media.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

initI18n();
initMedia({ reducedMotion });
