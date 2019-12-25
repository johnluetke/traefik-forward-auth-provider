import request from 'request';
import * as url from 'url';

import { Provider, User } from '.';

interface HomeAssistantConfig {
    client_id: string;
    url: string;
    parsedUrl: url.UrlObject;
}

export class HomeAssistant implements Provider {
    constructor(private config: HomeAssistantConfig) {
    }

    public exchangeCode(redirectUrl: string, code: string): Promise<string> {
        return new Promise((resolve, reject) => {
            request.post(this.tokenUrl(), {
                form: {
                    client_id: this.config.client_id,
                    code: code,
                    grant_type: "authorization_code",
                    redirect_uri: redirectUrl,
                },
                json: true
            },
            (err, response, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body['access_token']);;
                }
            });
        });
    }

    public getUser(token: string): Promise<User> {
        // Home Assistant does not provide a user endpoint
        return new Promise((resolve, reject) => {
            resolve({
                id:       "home-assistant-user",
                email:    `user@${this.config.parsedUrl.host}`,
                verified: true,
            } as User);
        });
    }

    public loginUrl(redirectUrl: string, state: string) {
        return url.format({
            ...this.config.parsedUrl,
            ...{
                pathname: '/auth/authorize',
                query: {
                    'redirect_uri': redirectUrl,
                    'client_id': this.config.client_id,
                    'state': state
                }
            } as url.UrlObject
        });
    }

    public name() {
        return "home-assistant";
    }

    public tokenUrl() {
        this.config.parsedUrl.pathname = "/auth/token";
        return url.format(this.config.parsedUrl);
    }

    public validate() {
        if (!this.config.url) {
            throw new Error(`${this.name()} requires a "url" option.`)
        }

        if (!this.config.client_id) {
            throw new Error(`${this.name()} requires a "client_id" option.`)
        }

        this.config.parsedUrl = url.parse(this.config.url);
        
        return true;
    }
}

