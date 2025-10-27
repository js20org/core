export function getOrderedItemByReferences(
    items: string[],
    references: Record<string, string[]>
): string[] {
    const visited: Record<string, boolean> = {};
    const result: string[] = [];

    let iterationCount = 0;

    const visit = (table: string) => {
        if (visited[table]) {
            return;
        }

        if (iterationCount >= 500) {
            throw new Error(
                'Exceeded 500 iterations. Possible circular dependencies in the references.'
            );
        }

        visited[table] = true;
        iterationCount++;

        if (references[table]) {
            references[table].forEach(visit);
        }

        result.push(table);
    };

    items.forEach(visit);

    return result.reverse();
}
