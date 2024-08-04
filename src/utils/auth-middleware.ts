import { getAuth } from '@clerk/fastify';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const { userId } = getAuth(request);

  if (!userId) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }

  request.userId = userId;
}
