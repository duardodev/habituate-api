import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function getAmountCompletedTasks(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().get(
    '/tasks/completed/amount',
    {
      schema: {
        summary: 'Get amount of completed tasks',
        tags: ['tasks'],
        response: {
          200: z.number(),
        },
      },
    },
    async (request, reply) => {
      const completedTasks = await prisma.task.findMany({
        where: {
          userId: request.userId,
          completed: true,
        },
      });

      const amountCompletedTasks = completedTasks.length;

      return reply.status(200).send(amountCompletedTasks);
    }
  );
}
