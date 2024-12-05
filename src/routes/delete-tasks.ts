import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function deleteTasks(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().delete(
    '/tasks',
    {
      schema: {
        summary: 'Delete all tasks',
        tags: ['tasks'],
        response: {
          200: z.null(),
        },
      },
    },
    async (request, reply) => {
      await prisma.task.deleteMany({
        where: {
          userId: request.userId,
        },
      });

      reply.status(200).send();
    }
  );
}
