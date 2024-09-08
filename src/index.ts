import Fastify from 'fastify'
import { initializeDatabase } from './Service/FirestoreService';
import { routes } from './routes';

initializeDatabase();

const fastify = Fastify({ trustProxy: true, logger: { level: 'trace' } })

// Google Cloud Run will set this environment variable for you, so
// you can also use it to detect if you are running in Cloud Run
const IS_GOOGLE_CLOUD_RUN = process.env.K_SERVICE !== undefined

// You must listen on the port Cloud Run provides
const port = Number(process.env.PORT || 3000)

// You must listen on all IPV4 addresses in Cloud Run
const host = IS_GOOGLE_CLOUD_RUN ? "0.0.0.0" : 'localhost'

fastify.register(routes);

async function start() {
    try {
        // await registerOAuth();
        const address = await fastify.listen({ port, host })
        console.log(`Listening on ${address}`)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

start()
