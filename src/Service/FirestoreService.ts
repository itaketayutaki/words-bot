import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import serviceAccount from '../../firestore-credentials.json';
import { Character } from '../Model/Character';

let db: Firestore;

export const initializeDatabase = async () => {
    initializeApp({
        credential: cert(serviceAccount as unknown as string)
    });

    db = getFirestore()
}

export const fetchCharacter = async (id: string): Promise<Character> => {
    const character = (await db.collection('Characters').doc(id).get()).data();
    if (character === undefined) {
        throw new Error(`Character ${id} not found`);
    }

    return { id, ...character } as Character;
}

export const fetchCharacters = async (): Promise<Character[]> => {
    const snapshot = await db.collection('Characters').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Character);
}

export const updateStateAndVerifier = async (character: Character, state: string, codeVerifier: string) => {
    await db.collection('Characters').doc(character.id).update({ state, codeVerifier })
}

export const updateRefreshToken = async (character: Character, refreshToken: string) => {
    await db.collection('Characters').doc(character.id).update({ refreshToken })
}
