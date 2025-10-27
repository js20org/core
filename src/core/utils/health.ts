import { sString } from '@js20/schema';
import { Plugin, PluginProps } from '../types';

export class HealthPlugin implements Plugin {
    async initialize(props: PluginProps) {
        props.addEndpoints({
            method: 'GET',
            path: '/',
            outputSchema: {
                message: sString().type(),
            },
            isLoggedIn: false,
            run: () => {
                return {
                    message: 'Running'
                };
            }
        });
    }
}