import path from 'path';
import { deployGcloudFrontend } from '@js20/deploy';

const run = async () => {
    await deployGcloudFrontend({
        baseUrl: 'https://www.js20.dev',
        directoryPath: path.resolve('./dist/website'),
        gcloudBucket: 'www.js20.dev',
        getCacheControl: () => 'cache-control:max-age=3600',
    });
};

run();
