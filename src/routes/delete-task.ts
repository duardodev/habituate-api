import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function deleteTask(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().delete(
    '/tasks/:id',
    {
      schema: {
        summary: 'Delete a task',
        tags: ['tasks'],
        params: z.object({
          id: z.string(),
        }),
        resposne: {
          200: z.null(),
          401: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const task = await prisma.task.findFirstOrThrow({
        where: {
          id,
        },
      });

      if (task.userId !== request.userId) {
        return reply.status(401).send();
      }

      await prisma.task.delete({
        where: {
          id: task.id,
        },
      });

      return reply.status(200).send();
    }
  );
}
