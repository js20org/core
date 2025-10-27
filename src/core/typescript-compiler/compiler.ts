import ts, {
    type InterfaceDeclaration,
    type Program,
    ScriptKind,
    ScriptTarget,
    type SourceFile,
    type VariableStatement,
} from 'typescript';
import fs from 'fs';
import type { BuiltInterface, BuiltInterfaceProperty, GenerateResolvedItem, TypescriptCompiler, TypescriptEnum, TypescriptInterface, TypescriptInterfaceProperty, TypescriptModelMap, TypescriptReference, TypescriptSchema, TypescriptType } from './types.js';
import { getModelMap } from './model-map.js';

const getSchema = (node: VariableStatement): TypescriptSchema | null => {
    const declaration = node.declarationList.declarations[0];
    const name = (declaration.name as any).text;

    const interfaceSymbol =
        declaration.type && ts.isTypeReferenceNode(declaration.type)
            ? declaration.type.typeName
            : undefined;

    const interfaceName = interfaceSymbol ? (interfaceSymbol as any).text : '';

    if (interfaceName) {
        return {
            name,
            interfaceName: interfaceName,
        };
    } else {
        return null;
    }
};

const isNodeSchema = (node: ts.Node) => {
    if (!ts.isVariableStatement(node)) {
        return false;
    }

    const declaration = node.declarationList.declarations[0];
    const name = (declaration.name as any).text;

    return /^s[A-Z]/.test(name);
};

const getModelReferences = (interfaceDeclaration: ts.InterfaceDeclaration) => {
    if (!interfaceDeclaration.members) {
        return [];
    }

    const result: TypescriptReference[] = [];

    for (const member of interfaceDeclaration.members) {
        const isPropertySignature = ts.isPropertySignature(member);

        if (!isPropertySignature || !member.name) {
            continue;
        }

        const propertyName = (member.name as any).text;
        const typeNode = member.type;

        const isValidModelType =
            typeNode &&
            ts.isTypeReferenceNode(typeNode) &&
            ts.isIdentifier(typeNode.typeName) &&
            typeNode.typeName?.text === 'Model';

        if (!isValidModelType) {
            continue;
        }

        const typeArguments = typeNode.typeArguments;
        const hasTypeArguments =
            typeNode.typeArguments && typeArguments!.length > 0;

        if (hasTypeArguments) {
            const modelType = (typeArguments![0] as any).typeName?.text;

            if (!modelType) {
                continue;
            }

            result.push({
                name: propertyName,
                type: modelType,
            });
        }
    }

    return result;
};

const getInterfaceReferences = (
    interfaceDeclaration: ts.InterfaceDeclaration
) => {
    if (!interfaceDeclaration.members) {
        return [];
    }

    const result: TypescriptReference[] = [];

    ts.forEachChild(interfaceDeclaration, (node) => {
        const isPropertySignature = ts.isPropertySignature(node);

        if (!isPropertySignature) {
            return;
        }

        const propertyName = (node.name as any).text;
        const typeNode = node.type;

        const isValidReference =
            typeNode &&
            ts.isTypeReferenceNode(typeNode) &&
            ts.isIdentifier(typeNode.typeName);

        const isValidArrayReference =
            typeNode &&
            ts.isArrayTypeNode(typeNode) &&
            ts.isTypeReferenceNode(typeNode.elementType) &&
            ts.isIdentifier(typeNode.elementType.typeName);

        if (isValidReference) {
            result.push({
                name: propertyName,
                type: typeNode.typeName.text,
            });
        }

        if (isValidArrayReference) {
            result.push({
                name: propertyName,
                type: typeNode.elementType.typeName.text,
            });
        }
    });

    return result;
};

const getInterfaceProperties = (
    node: InterfaceDeclaration
): TypescriptInterfaceProperty[] => {
    if (!node.members) {
        return [];
    }

    const result: TypescriptInterfaceProperty[] = [];

    for (const member of node.members) {
        if (!ts.isPropertySignature(member)) {
            continue;
        }

        const propertyName = (member.name as any).text;
        const isOptional = member.questionToken !== undefined;

        result.push({
            name: propertyName,
            isOptional: isOptional,
        });
    }

    return result;
};

const getInterface = (node: InterfaceDeclaration): TypescriptInterface => {
    const modelReferences = getModelReferences(node);
    const interfaceReferences = getInterfaceReferences(node);
    const properties = getInterfaceProperties(node);

    return {
        name: node.name.text,
        modelReferences,
        interfaceReferences,
        properties,
        node,
    };
};

const getType = (node: ts.TypeAliasDeclaration): TypescriptType => {
    const children: string[] = [];
    const name = node.name.text;

    if (node.type && ts.isIntersectionTypeNode(node.type)) {
        node.type.types.forEach((typeNode) => {
            if (ts.isTypeReferenceNode(typeNode)) {
                children.push((typeNode.typeName as any).text);
            }
        });
    }

    return {
        name,
        children,
    };
};

const getEnum = (node: ts.EnumDeclaration): TypescriptEnum => {
    const content: Record<string, string> = {};

    for (const member of node.members) {
        if (!ts.isEnumMember(member)) {
            continue;
        }

        const name = (member.name as any).text;
        const initializer = (member.initializer as any).text;

        content[name] = initializer;
    }

    return {
        name: node.name.text,
        content,
        node,
    };
};

const getAllNodes = (ownFiles: SourceFile[]) => {
    const interfaces: TypescriptInterface[] = [];
    const types: TypescriptType[] = [];
    const enums: TypescriptEnum[] = [];
    const schemas: TypescriptSchema[] = [];

    for (const sourceFile of ownFiles) {
        ts.forEachChild(sourceFile, (node) => {
            const isInterface = ts.isInterfaceDeclaration(node);
            const isEnum = ts.isEnumDeclaration(node);
            const isSchema = isNodeSchema(node);
            const isType = ts.isTypeAliasDeclaration(node);

            if (isInterface) {
                interfaces.push(getInterface(node));
            } else if (isType) {
                types.push(getType(node));
            } else if (isEnum) {
                enums.push(getEnum(node));
            } else if (isSchema) {
                const value = getSchema(node as VariableStatement);

                if (value) {
                    schemas.push(value);
                }
            }
        });
    }

    return {
        interfaces: interfaces.filter((i) => !!i),
        enums: enums.filter((i) => !!i),
        types: types.filter((i) => !!i),
        schemas: schemas.filter((i) => !!i),
    };
};

const getNodeWithExport = (node: ts.Node) => {
    const hasExport = (node as any).modifiers?.some(
        (m: any) => m.kind === ts.SyntaxKind.ExportKeyword
    );

    const shouldUpdateEnum = ts.isEnumDeclaration(node) && !hasExport;
    const shouldUpdateInterface = ts.isInterfaceDeclaration(node) && !hasExport;

    if (shouldUpdateEnum) {
        return ts.factory.updateEnumDeclaration(
            node,
            [
                ...(node.modifiers || []),
                ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
            ],
            node.name,
            node.members
        );
    }

    if (shouldUpdateInterface) {
        return ts.factory.updateInterfaceDeclaration(
            node,
            [
                ...(node.modifiers || []),
                ts.factory.createModifier(ts.SyntaxKind.ExportKeyword),
            ],
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members
        );
    }

    return node;
};

const buildNodes = (statements: any[], nodes: ts.Node[]) => {
    const hasItems = nodes.length > 0;

    if (!hasItems) {
        return;
    }

    for (const node of nodes) {
        statements.push(getNodeWithExport(node));
        statements.push(ts.factory.createIdentifier('\n'));
    }
};

const getStringFromNode = (node: ts.Node): string => {
    const printer = ts.createPrinter();
    return printer.printNode(
        ts.EmitHint.Unspecified,
        node,
        node.getSourceFile()
    );
};

const getBuiltInterface = (node: ts.Node): BuiltInterface | null => {
    if (!ts.isInterfaceDeclaration(node)) {
        return null;
    }

    const interfaceName = node.name.text;
    const properties: BuiltInterfaceProperty[] = [];

    for (const member of node.members) {
        if (ts.isPropertySignature(member)) {
            const name = (member.name as any).text;
            const type = getStringFromNode((member as any).type);
            const isOptional = member.questionToken;

            properties.push({
                name: isOptional ? `${name}?` : name,
                type,
            });
        }
    }

    return {
        name: interfaceName,
        properties: properties,
    };
};

const validateEntryPoint = (entryPath: string) => {
    if (!fs.existsSync(entryPath)) {
        throw new Error(`Entry path "${entryPath}" does not exist.`);
    }
};

export class DefaultTypescriptCompiler implements TypescriptCompiler {
    private program: Program;
    private ownFiles: SourceFile[];
    private allInterfaces: TypescriptInterface[] = [];
    private allTypes: TypescriptType[] = [];
    private allEnums: TypescriptEnum[] = [];
    private allSchemas: TypescriptSchema[] = [];
    private modelMap: TypescriptModelMap | null = null;

    constructor(srcPath: string, modelsName: string) {
        validateEntryPoint(srcPath);
        this.program = ts.createProgram([srcPath], {
            allowJs: true,
            skipLibCheck: true,
        });

        const sourceFiles = this.program.getSourceFiles();
        const isTypesShared = (fileName: string) => fileName.endsWith('types-shared.ts');

        this.ownFiles = sourceFiles.filter(
            (sourceFile) => isTypesShared(sourceFile.fileName) || !sourceFile.fileName.includes('node_modules')
        );

        const { interfaces, enums, schemas, types } = getAllNodes(
            this.ownFiles
        );

        this.allInterfaces = interfaces;
        this.allTypes = types;
        this.allEnums = enums;
        this.allSchemas = schemas;
        this.modelMap = getModelMap(interfaces, types, modelsName);
    }

    getCompilation() {
        return {
            interfaces: this.allInterfaces,
            types: this.allTypes,
            enums: this.allEnums,
            schemas: this.allSchemas,
            modelMap: this.modelMap,
        };
    }

    build(
        enums: GenerateResolvedItem[],
        interfaces: GenerateResolvedItem[]
    ) {
        const newSourceFile = ts.createSourceFile(
            'newInterfaceFile.ts',
            '',
            ScriptTarget.Latest,
            false,
            ScriptKind.TS
        );

        const statements = newSourceFile.statements as unknown as any[];

        const includedEnums = enums.map(
            (e) => this.allEnums.find((i) => i.name === e.name)!.node
        );

        const includedInterfaces = interfaces.map(
            (e) => this.allInterfaces.find((i) => i.name === e.name)!.node
        );

        const builtInterfaces = includedInterfaces.map(getBuiltInterface).filter(i => !!i);

        buildNodes(statements, includedEnums);
        buildNodes(statements, includedInterfaces);

        const printer = ts.createPrinter({
            newLine: ts.NewLineKind.LineFeed,
        });

        const output = printer.printFile(newSourceFile);

        return {
            output,
            builtInterfaces,
        };
    }
}
