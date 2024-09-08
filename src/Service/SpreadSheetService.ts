import path from 'path';
import { google } from 'googleapis'
import fs from 'fs/promises'
import { authenticate } from '@google-cloud/local-auth';
import { BaseExternalAccountClient, OAuth2Client } from 'google-auth-library';
import { Character } from '../Model/Character';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'spreadsheet-credentials.json');

async function loadSavedCredentialsIfExist() {
    try {
        const content = await fs.readFile(TOKEN_PATH, { encoding: 'utf-8' });
        const credentials = JSON.parse(content);
        return google.auth.fromJSON(credentials) as BaseExternalAccountClient;
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function saveCredentials(client: OAuth2Client) {
    const content = await fs.readFile(CREDENTIALS_PATH, { encoding: 'utf-8' });
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    const payload = JSON.stringify({
        type: 'authorized_user',
        client_id: key.client_id,
        client_secret: key.client_secret,
        refresh_token: client.credentials.refresh_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
    const client = await loadSavedCredentialsIfExist();
    if (client) {
        return client;
    }
    const client2 = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
    });
    if (client2.credentials) {
        await saveCredentials(client2);
    }
    return client2;
}

export async function fetchWords(character: Character): Promise<string[][]> {
    const auth = await authorize()
    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SPREADSHEET_ID as string,
        range: `${character.name}${process.env.SPREADSHEET_RANGE_SUFFIX}`,
    });
    const rows = res.data.values;
    if (!rows || rows.length === 0) {
        throw new Error('No data found.');
    }
    return rows.filter(row => row.length > 0).slice(1);
}
