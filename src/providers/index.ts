export interface Provider {
    exchangeCode(): void;
    loginUrl(redirectUrl: string, state: string): string;
    name(): string;
    tokenUrl(): string;
    userUrl(): string | null;
    validate(): boolean;
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