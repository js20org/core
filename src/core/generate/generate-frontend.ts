import { format, Options } from 'prettier';
import { AppData, GenerateConfig } from '../types';
import { DefaultTypescriptCompiler } from '../typescript-compiler/compiler';
import { getPlainTypescriptCode } from './builders/plain-typescript';
import { httpCode } from './code-blocks/http';
import { validationCode } from './code-blocks/validation';
import { getGenerateComment } from './comment';
import { getSection } from './section';
import { getAppCode } from './app-code';
import { getSettingsCode } from './code-blocks/settings';
import { GenerateLogger } from './logger';

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
