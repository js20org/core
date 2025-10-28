import fs from 'fs';
import path, { dirname } from 'path';
import { RawArgsCommand, Website, buildWebsite } from '@js20/markdown-site';
import { getNonSpaceCharCount } from './utils/file-size';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getDeIndentedString(input: string): string {
    const numberOfSpaces = getNumberOfSpacesIndent(input);

    if (numberOfSpaces > 0) {
        const regex = new RegExp(`^\\s{0,${numberOfSpaces}}`, 'gm');
        return input.replace(regex, '');
    } else {
        return input;
    }
}

function getNumberOfSpacesIndent(input: string) {
    const lines = input.split('\n');
    let minSpaces = Infinity;

    for (const line of lines) {
        if (line.trim() === '') {
            // Skip empty lines
            continue;
        }

        const trimmed = line.match(/^(\s*)/);
        const spaces = trimmed ? trimmed[0].length : 0;
        minSpaces = Math.min(minSpaces, spaces);
    }

    return minSpaces === Infinity ? 0 : minSpaces;
}

function getTags(content: string) {
    /*
    Tag format:
    //<tag>
    ... content ...
    //</tag>
    */
    const tagRegex = /\/\/\s?<([\w-]+)>([\s\S]*?)\/\/\s?<\/\1>/g;
    const tags: { [key: string]: string } = {};
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
        const tagName = match[1].trim();
        const tagContent = match[2];

        tags[tagName] = tagContent;
    }

    return tags;
}

function getImportedContentByTags(filePath: string, tag?: string): string {
    const fullPath = path.resolve(process.cwd(), filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const tags = getTags(content);
    const hasTags = Object.keys(tags).length > 0;
    const hasRequestedTag = hasTags && tag && tags[tag];

    if (hasRequestedTag) {
        return tags[tag];
    } else if (hasTags) {
        return Object.values(tags).join('\n\n');
    } else {
        return content;
    }
}

function getCodeOutputIfExists(filePath: string): string | null {
    const withoutExtension = filePath.replace(/\.[^/.]+$/, '');
    const fullPath = path.resolve(process.cwd(), 'src/examples/output/logs', withoutExtension + '.output.txt');

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    return fs.readFileSync(fullPath, 'utf8');
}

function getResponsesIfExist(filePath: string): string | null {
    const withoutExtension = filePath.replace(/\.[^/.]+$/, '');
    const fullPath = path.resolve(process.cwd(), 'src/examples/output/responses', withoutExtension + '.txt');

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    return fs.readFileSync(fullPath, 'utf8');
}

function getHighlightJsLanguageClass(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
        case '.js':
            return 'language-javascript';
        case '.ts':
            return 'language-typescript';
        case '.html':
            return 'language-html';
        case '.css':
            return 'language-css';
        default:
            return 'language-plaintext';
    }
}

function getFormattedText(text: string): string {
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getImportItems(args: string[]) {
    return args.map((arg) => {
        const hasSeparator = arg.includes('#');
        
        if (hasSeparator) {
            const [filePath, tag] = arg.trim().split('#');

            return {
                filePath,
                tag,
            };
        } else {
            return {
                filePath: arg.trim(),
                tag: undefined,
            };
        }
    })
}

function getCodeWithoutImports(code: string): string {
    const importRegex = /^\s*import\s.*?;?\s*$/gm;
    return code.replace(importRegex, '').trim();
}

function getFileSize(filePath: string): number {
    const fullPath = path.resolve(process.cwd(), filePath);
    const code = getImportedContentByTags(fullPath);
    const formattedCode = getFormattedText(getDeIndentedString(code)).trim();
    const withoutImports = getCodeWithoutImports(formattedCode);

    return getNonSpaceCharCount(withoutImports);
}

function getCodeReductionData() {
    const files = {
        traditional: {
            backend: './src/examples/raw/calculations-traditional-backend.ts',
            frontend: './src/examples/raw/calculations-traditional-frontend.ts',
        },
        js20: {
            backend: './src/examples/raw/calculations-js20-backend.ts',
            frontend: './src/examples/raw/calculations-js20-frontend.ts',
        }
    };

    const traditionalBackendSize = getFileSize(files.traditional.backend);
    const traditionalFrontendSize = getFileSize(files.traditional.frontend);
    const js20BackendSize = getFileSize(files.js20.backend);
    const js20FrontendSize = getFileSize(files.js20.frontend);

    const traditionalTotal = traditionalBackendSize + traditionalFrontendSize;
    const js20Total = js20BackendSize + js20FrontendSize;

    const reduction = ((traditionalTotal - js20Total) / traditionalTotal) * 100;
    const roundedReduction = Math.round(reduction);

    return {
        traditionalBackendSize,
        traditionalFrontendSize,
        traditionalTotal,
        js20BackendSize,
        js20FrontendSize,
        js20Total,
        reduction: reduction.toFixed(2),
        roundedReduction,
        reductionString: `${roundedReduction}%`,
    };
}

const reductionData = getCodeReductionData(); 

const sizeCommand: RawArgsCommand = {
    id: 'size',
    run: () => {
        const {
            traditionalBackendSize,
            traditionalFrontendSize,
            traditionalTotal,
            js20BackendSize,
            js20FrontendSize,
            js20Total,
            reduction,
            roundedReduction,
        } = reductionData;

        return `<h4>Traditional dev:</h4>
<ul>
<li>Backend: ${traditionalBackendSize} characters</li>
<li>Frontend: ${traditionalFrontendSize} characters</li>
<li><b>Total</b>: ${traditionalTotal} characters</li>
</ul>

<h4>JS20:</h4>
<ul>
<li>Backend: ${js20BackendSize} characters</li>
<li>Frontend: ${js20FrontendSize} characters</li>
<li><b>Total</b>: ${js20Total} characters</li>
</ul>

<h4>Code reduction:</h4>
<ul>
<li>((A - B) / A) × 100</li>
<li>((${traditionalTotal} - ${js20Total}) / ${traditionalTotal}) × 100 = ${reduction}% ~= ${roundedReduction}%</li>
</ul>`;
    },
};

const codeQuoteCommand: RawArgsCommand = {
    id: 'codeQuote',
    run: () => {
        return `<blockquote>🚀 JS20 has shown to <b>reduce code</b> by up to <b>${reductionData.reductionString}</b> in real world applications. This reduces bugs, improves maintainability, and speeds up development.</blockquote>`;
    }
};

const importCommand: RawArgsCommand = {
    id: 'import',
    run: (_props, args) => {
        const showOutput = args.includes('--show-output');
        const argsWithoutFlags = args.filter(arg => !arg.startsWith('--'));
        const importItems = getImportItems(argsWithoutFlags);
        const lines: string[] = [];

        for (const item of importItems) {
            const code = getImportedContentByTags(item.filePath, item.tag);
            const formattedCode = getFormattedText(getDeIndentedString(code)).trim();
            const fileName = path.basename(item.filePath);

            const output = showOutput ? getCodeOutputIfExists(fileName) : null;
            const formattedOutput = output ? getFormattedText(output) : '';

            const responses = getResponsesIfExist(fileName);
            const formattedResponses = responses ? getFormattedText(responses) : '';

            const language = getHighlightJsLanguageClass(item.filePath);

            lines.push(`<pre><code class="${language}">${formattedCode}</code></pre>`);

            if (formattedOutput) {
                lines.push(`<p>Provides the following output:</p>`);
                lines.push(`<pre><code class="language-bash">${formattedOutput}</code></pre>`);
            }

            if (formattedResponses) {
                lines.push(`<p>Example requests:</p>`);
                lines.push(`<pre><code class="language-json">${formattedResponses}</code></pre>`);
            }
        }

        return lines.join('\n');
    },
};

const outputDirectoryPath = path.resolve(__dirname, '../website');
const website: Website = {
    url: 'https://www.js20.com',
    name: 'js20.com',
    sitePath: path.resolve(__dirname, '../../src/docs/site'),
    publicPath: path.resolve(__dirname, '../../src/docs/assets/public'),
    outputDirectoryPath,
    cssImports: {
        css: 'public/main.css',
    },
    jsImports: {
        js: 'public/main.js',
    },
    faviconFileName: 'public/favicon.png',
    defaultMetadata: {
        title: 'JS20 - 90% less code for TypeScript backends & SDKs',
        description: 'Build TypeScript backends and SDKs with up to 90% less code. Faster, cheaper & easier to maintain. Ready for the AI era, less code = less tokens & reduced costs.',
        keywords: 'backend, framework, AI',
        author: 'r-jsv',
        imageUrl: 'https://www.js20.com/public/images/ogimage.png',
        language: 'en_US',
    },
    commands: [importCommand, sizeCommand, codeQuoteCommand],
    htmlTemplates: [
        {
            key: 'docs',
            path: path.resolve(__dirname, '../../src/docs/assets/html/docs.html'),
            isDefault: true,
        },
        {
            key: 'start',
            path: path.resolve(__dirname, '../../src/docs/assets/html/start.html'),
        },
        {
            key: 'plain',
            path: path.resolve(__dirname, '../../src/docs/assets/html/plain.html'),
        },
    ],
};

buildWebsite(website);

const reductionPath = path.resolve(outputDirectoryPath, 'public/reduction.json');
fs.writeFileSync(reductionPath, JSON.stringify(reductionData, null, 4));
