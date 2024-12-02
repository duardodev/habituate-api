import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function toggleTask(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().patch(
    '/tasks/:id/toggle',
    {
      schema: {
        summary: 'Toggle a task to completed or not completed',
        tags: ['tasks'],
        params: z.object({
          id: z.string(),
        }),
        response: {
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

      await prisma.task.update({
        where: {
          id: task.id,
        },
        data: {
          completed: !task.completed,
        },
      });

      reply.status(200).send();
    }
  );
}
