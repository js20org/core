import { ReferenceBuilder } from './types';

export class DefaultReferenceBuilder implements ReferenceBuilder {
    private includedInterfaces: string[] = [];
    private includedEnums: string[] = [];
    private includedSchemas: string[] = [];
    private imports: string[] = [];

    constructor(
        explicitInterfaces: string[],
        explicitEnums: string[],
        explicitSchemas: string[]
    ) {
        this.includedInterfaces = explicitInterfaces;
        this.includedEnums = explicitEnums;
        this.includedSchemas = explicitSchemas;
    }

    registerInterface(name: string) {
        const hasInterface = this.includedInterfaces.includes(name);

        if (!hasInterface) {
            this.includedInterfaces.push(name);
        }
    }

    registerEnum(name: string) {
        const hasEnum = this.includedEnums.includes(name);

        if (!hasEnum) {
            this.includedEnums.push(name);
        }
    }

    registerSchema(schema: string) {
        const hasSchema = this.includedSchemas.includes(schema);

        if (!hasSchema) {
            this.includedSchemas.push(schema);
        }
    }

    registerImport(src: string, values: string[]) {
        const valuesString = values.join(', ');
        this.imports.push(`import { ${valuesString} } from '${src}';`);
    }

    getReferences() {
        return {
            interfaces: this.includedInterfaces.filter((i) => !!i),
            enums: this.includedEnums.filter((i) => !!i),
            schemas: this.includedSchemas.filter((i) => !!i),
            imports: this.imports,
        };
    }
}
