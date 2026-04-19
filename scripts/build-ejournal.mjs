import { execSync } from 'child_process';
import { mkdirSync, cpSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const ejournalDir = resolve(root, 'ejournal/ejournal_new_design');
const publicDir = resolve(root, 'public/ejournal');

execSync('npm run build', { cwd: ejournalDir, stdio: 'inherit' });
mkdirSync(publicDir, { recursive: true });
cpSync(resolve(ejournalDir, 'dist'), publicDir, { recursive: true });
console.log('ejournal скопирован в public/ejournal/');
