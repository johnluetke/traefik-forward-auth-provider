export interface Provider {
    exchangeCode(): void;
    loginUrl(): string;
    name(): string;
    tokenUrl(): string;
    userUrl(): string | null;
    validate(): boolean;
}

const providers = new Map<string, Provider>();

export function getProviderByName(name: string, config: any = {}): Provider {
    if (providers.has(name)) {
        return providers.get(name) as Provider;
    } else {
        switch (name) {
            default:
                throw new Error(`Unknown provider ${name}`);
        }
    }
}