export function getPascalCasing(value: string): string {
    const split = value.split(' ');
    let result = '';

    split.forEach((s) => {
        const isEmpty = s.length === 0;

        if (isEmpty) {
            return;
        }

        const firstChar = s.charAt(0);
        const otherChars = s.slice(1);

        result += firstChar.toUpperCase() + otherChars;
    });

    return result;
}

export const getUriCasing = (value: string): string => {
    const lowercase = value.toLowerCase();
    return lowercase.replace(/ /g, '-');
};
