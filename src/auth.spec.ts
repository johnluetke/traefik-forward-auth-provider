import { Request, Response } from "express";

import * as auth from "./auth";
import { Config } from "./config";
import { Provider } from "./providers";

describe('auth', () => {
    let mockRequest: Request, mockResponse: Response, config: Config;

    beforeEach(() => {
        mockRequest = {
            header: (n: string) => "header-value"
        } as Request;

        mockResponse = {
            cookie: (c: string, v: string, o: any) => {}
        } as Response;

        config = {
            authCookieName: 'auth',
            csrfCookieName: 'csrf',
            secret: 'sooper-dooper'
        } as Config;
    });

    describe('getProviderNameFromRequest', () => {
        it('should return the provider name from the state query param', ()=> {
            mockRequest['query'] = {
                state: 'nonce:test-provider:http://redirect_url/'
            };

            expect(auth.getProviderNameFromRequest(mockRequest)).toBe('test-provider')
        });
    });

    describe('getRedirectFromRequest', () => {
        it('should return the redirect url from the state query param', ()=> {
             mockRequest['query'] = {
                state: 'nonce:test-provider:http://redirect_url/'
            };

            expect(auth.getRedirectFromRequest(mockRequest)).toBe('http://redirect_url/')
        });
    });

    describe('clearCsrfCookie', () => {
        let spy: jest.SpyInstance;

        beforeEach(() => {
            spy = jest.spyOn(mockResponse, 'cookie');

            auth.clearCsrfCookie(
                mockRequest as Request,
                mockResponse as Response,
                config);
        })

        it('should clear the value of the csrf cookie', ()=> {
            expect(spy).toHaveBeenCalledWith(
                'csrf',
                '',
                expect.any(Object));
        });

        it('should set the expiry time of the csrf cookie in the past', ()=> {
            // TODO: need validation of actual date value
            expect(spy).toHaveBeenCalledWith(
                'csrf',
                '',
                expect.objectContaining({
                    expires: expect.any(Date)
                }));
        });
    });

    xdescribe('makeAuthCookie', () => {

    });

    xdescribe('makeCsrfCookie', () => {

    });

    xdescribe('makeNonce', () => {

    });

    describe('makeState', () => {
        let state: string, nonce: string;
        let provider: Provider; 

        beforeEach(() => {
            provider = {
                name: () => 'test-provider'
            } as Provider
            nonce = '1234';
            state = auth.makeState(mockRequest, provider, nonce)
        });
        it('should add the nonce value to the cookie', () => {
            expect(state.split(':')[0]).toBe(nonce);
        });

        it('should add the provider name to the cookie', () => {
            expect(state.split(':')[1]).toBe('test-provider');
        });

        it('should add the redirect url to the cookie', () => {
            expect(state.split(':')[2]).toBe('header-value');
            expect(state.split(':')[3]).toBe('//header-valueheader-value');
        });
    });

    describe('redirectBase', () => {
        beforeEach(() => {
            jest.spyOn(mockRequest, 'header')
                .mockReturnValueOnce('http')
                .mockReturnValueOnce('example.com')
        });

        it('should contruct the base redirect url from header values', () => {
            expect(auth.redirectBase(mockRequest)).toBe('http://example.com');
        });
    });

    describe('redirectUrl', () => {
        beforeEach(() => {
            jest.spyOn(mockRequest, 'header')
                .mockReturnValueOnce('http')
                .mockReturnValueOnce('example.com')
        });

        it('should contruct the full redirect url from header values', () => {
            expect(redirectUrl(mockRequest)).toBe('http://example.com/callback');
        });
    });

    describe('validateCsrfCookie', () => {
        beforeEach(() => {
            mockRequest['query'] = {
                state: '0123456789ABCDEF0123456789ABCDEF:provider:url'
            };
            mockRequest['cookies'] = {
                csrf: '0123456789ABCDEF0123456789ABCDEF'
            }
        });

        it('should fail if the cookie length is invalid', () => {
            mockRequest['cookies'] = {
                csrf: 'too-short-length'
            }
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = auth.validateCsrfCookie(mockRequest, mockResponse, config);
            
            expect(result).toBeFalsy();
            expect(spy).toHaveBeenCalledWith('Invalid CSRF cookie value');
        });

        it('should fail if the state length is invalid', () => {
            mockRequest['query'] = {
                state: 'too-short-length'
            }
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = auth.validateCsrfCookie(mockRequest, mockResponse, config);
            
            expect(result).toBeFalsy();
            expect(spy).toHaveBeenCalledWith('Invalid state value');
        });

        it('should fail if the cookie does not match the state', () => {
            mockRequest['cookies'] = {
                csrf: 'FEDCBA9876543210FEDCBA9876543210'
            }
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = auth.validateCsrfCookie(mockRequest, mockResponse, config);
            
            expect(result).toBeFalsy();
            expect(spy).toHaveBeenCalledWith('CSRF value does not match state');
        });

        it('should pass if the cookie and state are valid', () => {
            const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

            const result = auth.validateCsrfCookie(mockRequest, mockResponse, config);
            
            expect(result).toBeTruthy();
        });
    });
});