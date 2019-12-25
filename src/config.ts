import {cosmiconfigSync} from 'cosmiconfig';
import * as fs from 'fs';

import { getProviderByName } from './providers';

const name = require("../package.json").name;
const configLoader = cosmiconfigSync(name);

export interface Config {
    authCookieName: string
    csrfCookieName: string;
    port: number;
    provider: string;
    providers: {[key: string]: any};
    secret: string;
    userBlacklist: string[],
    userWhitelist: string[]
}

let configuration: Config;

const PACKAGE_CONFIG_FILE = './node_modules/traefik-forward-auth-provider/package.json';

export function loadConfiguration(): Config {
    let defaultConfig = {} as Config;
    if (fs.existsSync(PACKAGE_CONFIG_FILE)) {
        console.debug('Loading defaults from library configuration file.');
        defaultConfig = configLoader.load(PACKAGE_CONFIG_FILE)?.config;
    }
    
    const config = configLoader.search();
    if (!config) {
        console.debug('Using default configuration.');
        configuration = defaultConfig;
    } else {
        console.debug('Merging specified configuration with default configuration.');
        configuration = {...defaultConfig, ...config.config};
    }

    console.debug(`Using configuration: ${JSON.stringify(configuration)}`);
    return configuration;
};

export function validateConfiguration(): void {
    // Validate selected provider configuration
    const providerName = configuration.provider;
    const p = getProviderByName(providerName, configuration.providers[providerName]);
    p.validate();
    console.debug(`Selected provider ${providerName} is valid.`);
}
