import { format, type Options } from 'prettier';
import type { AppData, GenerateConfig } from '../types.js';
import { DefaultTypescriptCompiler } from '../typescript-compiler/compiler.js';
import { getPlainTypescriptCode } from './builders/plain-typescript.js';
import { httpCode } from './code-blocks/http.js';
import { validationCode } from './code-blocks/validation.js';
import { getGenerateComment } from './comment.js';
import { getSection } from './section.js';
import { getAppCode } from './app-code.js';
import { getSettingsCode } from './code-blocks/settings.js';
import type { GenerateLogger } from './logger.js';

export async function getFrontendCode(config: GenerateConfig, app: AppData, logger: GenerateLogger): Promise<string> {
    const { entryPath, modelsName = 'Models', prettierOptions = {} } = config;

    const compiler = new DefaultTypescriptCompiler(entryPath, modelsName);
    const appCode = getAppCode(logger, compiler, app);
    const code = getPlainTypescriptCode(appCode);

    const contentItems = [
        getGenerateComment(config),
        getSection('App', code),
        getSection('Validation', validationCode),
        getSection('Settings', getSettingsCode(config.baseUrl)),
        getSection('HTTP', httpCode),
    ];

    const fileContent = contentItems.join('\n\n');
    const fullOptions: Options = {
        parser: 'typescript',
        tabWidth: 4,
        singleQuote: true,
        semi: true,
        trailingComma: 'none',
        bracketSpacing: false,
        objectWrap: 'collapse',
        singleAttributePerLine: false,
        ...prettierOptions,
    };

    return await format(fileContent, fullOptions);
}
