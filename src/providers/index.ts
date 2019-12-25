import { HomeAssistant } from './home-assistant';

export interface Provider {
    exchangeCode(redirectUrl: string, code: string): Promise<string>;
    getUser(token: string): Promise<User>;
    loginUrl(redirectUrl: string, state: string): string;
    name(): string;
    tokenUrl(): string;
    validate(): boolean;
}

export interface User {
    id: string;
    email: string;
    verified: boolean;
}

const providers = new Map<string, Provider>();

export function getProviderByName(name: string, config: any = {}): Provider {
    if (!providers.has(name)) {
        switch (name) {
            case "home-assistant":
                providers.set(name, new HomeAssistant(config));
                break;
            default:
                throw new Error(`Unknown provider ${name}`);
        }
    }

    return providers.get(name) as Provider;
}

export { HomeAssistant } from './home-assistant';