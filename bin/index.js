#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const files = [
    'src/index.ts',
    '_.env',
    '_tsconfig.json',
    '.gitignore',
    'package.json',
    'README.md'
];

const directories = [
    'src',
];

function getFilePaths(file) {
    const noSlashFile = file.replace(/^_/, '');
    const sourcePath = path.join(__dirname, '../', 'boilerplate', file);
    const targetPath = path.join(process.cwd(), noSlashFile);

    return { sourcePath, targetPath };
}

console.log('Generating @js20 project...');

directories.forEach(dir => {
    const targetDir = path.join(process.cwd(), dir);

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`- Created directory ${targetDir}`);
    }
});

files.forEach(file => {
    const { sourcePath, targetPath } = getFilePaths(file);

    if (fs.existsSync(targetPath)) {
        console.log(`- Skipped ${targetPath} (already exists)`);
    } else {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`- Created ${targetPath}`);
    }
});

console.log('');
console.log('✓ Project generation complete!');
console.log('Check README.md for next steps.');
