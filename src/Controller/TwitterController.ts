import { FastifyInstance } from "fastify";
import { fetchCharacter } from "../Service/FirestoreService";
import { generateAuthUrl as generateAuthUrlSerevice, tweet, updateRefreshToken } from '../Service/TwitterService'
import { fetchWords } from "../Service/SpreadSheetService";


export const TwitterController = async (fastify: FastifyInstance) => {
    fastify.get<{ Params: { id: string } }>('/:id/generate-auth-url', async (request, reply) => {
        const { id } = request.params
        const character = await fetchCharacter(id);
        const url = await generateAuthUrlSerevice(character);
        reply.redirect(url.toString());
    });

    fastify.get<{ Params: { id: string }, Querystring: { state: string, code: string } }>('/:id/callback', async (req, reply) => {
        const { id } = req.params
        const { state, code } = req.query

        const character = await fetchCharacter(id);

        const refreshToken = await updateRefreshToken(character, state, code)

        reply.send({ refresh_token: refreshToken });
    })

    fastify.post<{ Params: { id: string }, Reply: { message: string } }>('/:id/tweet', async (request, reply) => {
        const { id } = request.params
        const character = await fetchCharacter(id);
        const words = await fetchWords(character);
        const word = words[Math.floor(Math.random() * words.length)][0]
        await tweet(character, word)
        reply.send({ message: JSON.stringify(word) });
    });
}
