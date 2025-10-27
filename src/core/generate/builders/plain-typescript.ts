import { AppCode } from '../../types';

export function getPlainTypescriptCode(
    appCode: AppCode
): string {
    return `${appCode.builtEnumsAndInterfaces}\n\n${appCode.builtEndpoints}`;
}
