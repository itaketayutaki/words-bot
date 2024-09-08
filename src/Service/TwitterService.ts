import { randomUUID } from "crypto";
import { Character } from "../Model/Character";
import { updateStateAndVerifier, updateRefreshToken as updateRefreshTokenFirestore } from "./FirestoreService";

const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];

interface Token {
    token_type: 'bearer',
    expires_in: number,
    access_token: string,
    scope: string,
    refresh_token: string,
}

export const generateAuthUrl = async (character: Character): Promise<URL> => {
    const url = new URL('https://twitter.com/i/oauth2/authorize')
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', process.env[`TWITTER_CLIENT_ID_${character.id}`] as string)
    url.searchParams.set('redirect_uri', process.env[`TWITTER_REDIRECT_URL_${character.id}`] as string)
    url.searchParams.set('scope', SCOPES.join(' '))
    const state = randomUUID();
    url.searchParams.set('state', state)
    const codeVerifier = randomUUID() + randomUUID()
    url.searchParams.set('code_challenge', codeVerifier)
    url.searchParams.set('code_challenge_method', 'plain')

    // このタイミングでstateとcode_verifierを更新する
    await updateStateAndVerifier(character, state, codeVerifier)

    return url;
}

export const updateRefreshToken = async (character: Character, state: string, code: string): Promise<string> => {
    if (character.state !== state) {
        throw new Error('State is invalid')
    }

    const res = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': createAuthroizationHeader(character),
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env[`TWITTER_REDIRECT_URL_${character.id}`] as string,
            code_verifier: character.codeVerifier ?? '',
            client_id: process.env[`TWITTER_CLIENT_ID_${character.id}`] as string,
        })
    })
    const token = (await res.json()) as Token
    await updateRefreshTokenFirestore(character, token.refresh_token)

    return token.refresh_token;
}

export const tweet = async (character: Character, text: string) => {
    const accessToken = await fetchAccessTokens(character, character.refreshToken ?? '')
    await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            text
        }),
    })
}

/**
 * refresh_tokenの更新処理を含む
 */
const fetchAccessTokens = async (character: Character, refreshToken: string) => {
    const res = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': createAuthroizationHeader(character),
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        })
    })
    const token = (await res.json()) as Token
    await updateRefreshTokenFirestore(character, token.refresh_token)

    return token.access_token;
}

const createAuthroizationHeader = (character: Character) => {
    return 'Basic ' + Buffer.from(process.env[`TWITTER_CLIENT_ID_${character.id}`] + ':' + process.env[`TWITTER_CLIENT_SECRET_${character.id}`]).toString('base64')
}