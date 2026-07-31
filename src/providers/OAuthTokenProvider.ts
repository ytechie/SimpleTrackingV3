import * as request from 'request-promise';

export interface OAuthProviderOptions {
    // Send client_id/client_secret as an HTTP Basic auth header instead of in the body (UPS).
    useBasicAuth?: boolean;
    // Send the request body as JSON instead of form-urlencoded (USPS).
    json?: boolean;
    // Additional body parameters required by the carrier (e.g. USPS scope).
    extraParams?: { [key: string]: string };
}

// Handles the OAuth 2.0 Client Credentials flow used by the modern carrier APIs.
// Tokens are cached in memory and transparently refreshed shortly before they expire,
// so callers never have to think about authentication.
export class OAuthTokenProvider {
    private tokenUrl: string;
    private clientId: string;
    private clientSecret: string;
    private options: OAuthProviderOptions;

    private cachedToken: string = null;
    private tokenExpiryEpochMs: number = 0;

    // Refresh a little early so an in-flight request never uses an about-to-expire token.
    private static readonly EXPIRY_SKEW_MS = 60 * 1000;

    constructor(tokenUrl: string, clientId: string, clientSecret: string, options: OAuthProviderOptions = {}) {
        this.tokenUrl = tokenUrl;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.options = options;
    }

    async getToken(): Promise<string> {
        const now = Date.now();
        if (this.cachedToken && now < this.tokenExpiryEpochMs - OAuthTokenProvider.EXPIRY_SKEW_MS) {
            return this.cachedToken;
        }

        const params: { [key: string]: string } = Object.assign(
            { grant_type: 'client_credentials' },
            this.options.extraParams || {}
        );

        const headers: { [key: string]: string } = {};
        if (this.options.useBasicAuth) {
            const encoded = Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64');
            headers['Authorization'] = 'Basic ' + encoded;
        } else {
            params['client_id'] = this.clientId;
            params['client_secret'] = this.clientSecret;
        }

        const requestOptions: any = { headers, json: true };
        if (this.options.json) {
            requestOptions.body = params;
        } else {
            requestOptions.form = params;
        }

        const body = await request.post(this.tokenUrl, requestOptions);

        this.cachedToken = body.access_token;
        const expiresInSec = parseInt(body.expires_in, 10) || 3600;
        this.tokenExpiryEpochMs = now + expiresInSec * 1000;

        return this.cachedToken;
    }
}
