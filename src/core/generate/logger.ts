import { GenerateConfig } from '../types';

export interface GenerateLogger {
    log: (message: string) => void;
    print(config: GenerateConfig): void;
}

export class DefaultGenerateLogger implements GenerateLogger {
    private logs: string[] = [];

    log(message: string) {
        this.logs.push(message);
    }

    print({ outputs }: GenerateConfig) {
        console.log('');
        console.log('---------------------');
        console.log('');
        console.log('🚀 Generated code to:');
        
        for (const output of outputs) {
            console.log(' -', output);
        }
        
        console.log('');
        console.log('🧩 Functions:')

        for (const log of this.logs) {
            console.log(' -', log);
        }

        console.log('');
        console.log('---------------------');
        console.log('');
    }
}

export class EmptyGenerateLogger implements GenerateLogger {
    log() {
        // Do nothing
    }

    print() {
        // Do nothing
    }
}