// Runs before the hosting CLI, including deployments that skip the build.
import {loadEnv} from 'vite';
import {testModeEnabled} from './guard.mjs';
testModeEnabled('build','production',{...loadEnv('production',process.cwd(),''),...process.env});
