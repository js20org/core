export function getSection(name: string, ...items: string[]): string {
    const content = [
        `// ------------------ ${name} ------------------\n`,
        ...items,
    ].join('\n');

    return `\n${content}\n`;
}
