import {cosmiconfigSync} from 'cosmiconfig';

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

export function loadConfiguration(): Config {
    const config = configLoader.search();
    if (!config) {
        console.error('No configuration found!!!');
    } else {
        configuration = config.config;
    }

    return configuration;
};

export function validateConfiguration(): void {
    // Validate selected provider configuration
    const providerName = configuration.provider;
    const p = getProviderByName(providerName, configuration.providers[providerName]);
    p.validate();
    console.debug(`Selected provider ${providerName} is valid.`);
}
