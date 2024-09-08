import { FastifyInstance } from "fastify";
import { TwitterController } from "./Controller/TwitterController";


export const routes = async (fastify: FastifyInstance) => {
    fastify.register(TwitterController);

    fastify.get('/', (request, reply) => {
        console.log(request.hostname);
        reply.send({ message: 'Hello World!' })
    })
}
