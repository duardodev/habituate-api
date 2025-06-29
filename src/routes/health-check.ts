import { FastifyInstance } from "fastify";

export async function healthCheck(app: FastifyInstance) {
    app.get("/health", async (_, reply) => {
        return reply.status(200).send("OK");
    })
}