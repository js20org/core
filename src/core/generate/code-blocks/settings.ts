export function getSettingsCode(baseUrl: string): string {
    const safeBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `const baseUrl = "${safeBaseUrl}";`;
};
