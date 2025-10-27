import { type GenerateConfig } from '../types.js';

export function getGenerateComment({ appName, version, comment }: GenerateConfig): string {
    const parts = [];

    if (appName) {
        parts.push(`App Name: ${appName}`);
    }

    if (version) {
        parts.push(`Version: ${version}`);
    }

    if (comment) {
        parts.push(comment);
    }

        return `/**
 * AUTO-GENERATED FILE. DO NOT MODIFY.
 * ${parts.length > 0 ? '\n * ' + parts.join('\n * ') : ''}
 */`;
}