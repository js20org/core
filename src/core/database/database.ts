import { getValidatedSchema, sAny, sBoolean, sString, validateBySchema } from '@js20/schema';
import type { ComputedModel, Database, InternalModel, Model, ModelFactory, ModelFactoryProps, ModelItem, ModelObject, PluginProps } from '../types.js';
import { type Database as BetterSqlite3Database } from 'better-sqlite3';
import { Transaction } from 'sequelize';

const sModel: InternalModel<any> = {
    name: sString().nonEmpty().type(),
    schema: sAny().type(),
    isOwned: sBoolean().optional().type(),
    preserveName: sBoolean().optional().type(),
    isInternal: sBoolean().optional().type()
};

const validatedModelSchema = getValidatedSchema(sModel);

export abstract class BaseDatabase<Pool> implements Database<Pool> {
    private protectedFieldNames: string[];
    private models: ModelItem[] = [];

    constructor(protectedFieldNames: string[]) {
        this.protectedFieldNames = protectedFieldNames;
    }

    getModels() {
        return this.models;
    }

    addModels<M>(models: ModelObject<M>) {
        Object.values(models).forEach((model: any) => {
            validateBySchema(validatedModelSchema, model);

            if (!model.schema) {
                throw new Error(`Model '${model.name}' is missing a schema`);
            }
        });

        const items: ModelItem[] = Object.keys(models).map(key => ({
            ...(models as Record<string, Model<any>>)[key],
            modelKey: key
        }));

        this.models.push(...items);
    }

    async initialize(props: PluginProps) {
        props.addProtectedFieldNames(this.protectedFieldNames);
    }

    protected getThisDbModels(computed: ComputedModel[]) {
        return computed.filter(m => this.models.find(mod => mod.name === m.model.name));
    }

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract sync(computed: ComputedModel[]): Promise<void>;
    abstract getNewPool(): Pool | BetterSqlite3Database;
    abstract getModelFactories(props: ModelFactoryProps): Record<string, ModelFactory<any>>;
    abstract getTransaction(): Promise<Transaction>;
}
