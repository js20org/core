import { sBoolean, sInteger, sNumber, sString } from '@js20/schema';
import { App, BetterAuth, Model, MySqlDatabase } from '../../src/core';
import { ErrorHandler } from '../../src/core/types';

export interface ModelA {
    value: string;
    isFlag: boolean;
}

export interface ModelB {
    count: number;
    decimalValue: number;
    description?: string;
}

export const sModelA: ModelA = {
    value: sString().nonEmpty().type(),
    isFlag: sBoolean().type()
};

export const sModelB: ModelB = {
    count: sInteger().min(0).type(),
    decimalValue: sNumber().max(100).type(),
    description: sString().optional().type()
};

export interface Models {
    modelA: Model<ModelA>;
    modelB: Model<ModelB>;
}

export const models: Models = {
    modelA: {
        name: 'modelA',
        schema: sModelA
    },
    modelB: {
        name: 'modelB',
        schema: sModelB
    }
};

interface Props {
    models?: any;
    handleError?: ErrorHandler;
    initApp?: (app: App<Models>) => void;
}

export async function useMockApp(props: Props, callback: (app: App<Models>) => Promise<void>) {
    const database = new MySqlDatabase({
        isInMemory: true
    });

    const app = new App<Models>({
        handleError: props.handleError
    });

    database.addModels(props.models ?? models);
    app.addDatabase(database);

    const auth = new BetterAuth(database);
    app.setAuthenticator(auth);

    if (props.initApp) {
        props.initApp(app);
    }

    await app.start();
    await callback(app);
    await app.stop();
}
