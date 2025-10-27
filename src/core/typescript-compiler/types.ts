import ts, { type InterfaceDeclaration } from 'typescript';

export interface TypescriptReference {
    name: string;
    type: string;
}

export interface TypescriptInterfaceProperty {
    name: string;
    isOptional: boolean;
}

export interface TypescriptInterface {
    name: string;
    modelReferences: TypescriptReference[];
    interfaceReferences: TypescriptReference[];
    properties: TypescriptInterfaceProperty[];
    node: InterfaceDeclaration;
}

export interface BuiltInterfaceProperty {
    name: string;
    type: string;
}

export interface BuiltInterface {
    name: string;
    properties: BuiltInterfaceProperty[];
}

export interface GenerateResolvedItem {
    name: string;
    references: TypescriptReference[];
}

export interface TypescriptType {
    name: string;
    children: string[];
}

export interface TypescriptEnum {
    name: string;
    content: Record<string, string>;
    node: ts.EnumDeclaration;
}

export interface TypescriptSchema {
    name: string;
    interfaceName: string;
}

export interface Compilation {
    interfaces: TypescriptInterface[];
    types: TypescriptType[];
    enums: TypescriptEnum[];
    schemas: TypescriptSchema[];
    modelMap: TypescriptModelMap | null;
}

export type TypescriptModelMap = { [modelName: string]: string };

export interface ResolvedReferences {
    interfaces: GenerateResolvedItem[];
    enums: GenerateResolvedItem[];
    schemas: GenerateResolvedItem[];
}

export interface GenerateReferences {
    interfaces: string[];
    enums: string[];
    schemas: string[];
    imports: string[];
}

export interface ReferenceBuilder {
    registerInterface: (name: string) => void;
    registerEnum: (name: string) => void;
    registerSchema: (schema: string) => void;
    registerImport: (src: string, values: string[]) => void;
    getReferences: () => GenerateReferences;
}

export interface TypescriptCompiler {
    getCompilation: () => Compilation;

    build(
        enums: GenerateResolvedItem[],
        interfaces: GenerateResolvedItem[],
        enumIntro?: string,
        interfaceIntro?: string
    ): {
        output: string;
        builtInterfaces: BuiltInterface[];
    };
}
