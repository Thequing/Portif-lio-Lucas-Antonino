// Runs the balance suite off the main thread, so 10,000 races never stutter the
// page. It imports the same runSuite() that node tests, so what the visitor
// measures and what the suite asserts are the same code.
import { runSuite } from './drift-suite.js';

self.addEventListener('message', (e) => {
  const { races, seed } = e.data ?? {};
  const result = runSuite({ races, seed });
  self.postMessage({ type: 'done', result });
});
