export interface Character {
    id: string,
    name: string,
    refreshToken?: string,
    state?: string,
    codeVerifier?: string,
}
