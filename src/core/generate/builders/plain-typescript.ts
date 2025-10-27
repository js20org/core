import { type AppCode } from '../../types.js';

export function getPlainTypescriptCode(
    appCode: AppCode
): string {
    return `${appCode.builtEnumsAndInterfaces}\n\n${appCode.builtEndpoints}`;
}
