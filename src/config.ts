import {cosmiconfigSync} from 'cosmiconfig';

const name = require("../package.json").name;
const configLoader = cosmiconfigSync(name);

// TODO: strongly type config object
export function load(): any {
    const config = configLoader.search();
    if (!config) {
        // TODO: warn about default load
        // TODO: Hardcoded default config
        return {}
    }
    return config.config;
};

export function validate(): void {
    
}
