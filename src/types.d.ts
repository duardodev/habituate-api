import '@fastify/fastify';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string | ObjectId;
  }
}
