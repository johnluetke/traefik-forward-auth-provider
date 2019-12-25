import { HomeAssistant } from "./home-assistant";

describe('home-assistant', () => {
    let provider: HomeAssistant;

    beforeEach(() => {
        provider = new HomeAssistant({
            client_id: 'client_id',
            url: 'http://home-assistant.io',
        } as any);

        provider.validate();
    });

    describe('exchangeCode', () => {
    });

    describe('getUser', () => {
        it('should return an email user@{configured_url}', () => {
            expect(provider.getUser('fake_token')).resolves.toMatchObject({
                email: 'user@home-assistant.io'
            });
        });
    });

    describe('loginUrl', () => {
        it('should construct the login url', () => {
            expect(provider.loginUrl("redirect", "state")).toContain("http://home-assistant.io/auth/authorize");
        });
    });

    describe('tokenUrl', () => {
        it('should construct the token url', () => {
            expect(provider.tokenUrl()).toContain("http://home-assistant.io/auth/token");
        });
    });

    describe('validate', () => {
        it('should fail if no url is provided', () => {
            provider = new HomeAssistant({
                client_id: 'client_id'
            } as any);
    
            expect(() => provider.validate()).toThrow('home-assistant requires a "url" option.');
        })

        it('should fail if no client_id is provided', () => {
            provider = new HomeAssistant({
                url: 'http://home-assistant.io'
            } as any);
    
            expect(() => provider.validate()).toThrow('home-assistant requires a "client_id" option.');
        })
    });

});