import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function getTasks(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().get(
    '/tasks',
    {
      schema: {
        summary: 'Get tasks',
        tags: ['tasks'],
        response: {
          201: z.object({
            tasks: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                userId: z.string(),
                priority: z.string(),
                completed: z.boolean(),
                createdAt: z.date(),
              })
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const tasks = await prisma.task.findMany({
        where: {
          userId: request.userId!,
        },
        orderBy: {
          priority: 'asc',
        },
      });

      return reply.status(200).send({
        tasks: tasks.map(task => {
          return {
            id: task.id,
            title: task.title,
            userId: task.userId,
            priority: task.priority,
            completed: task.completed,
            createdAt: task.createdAt,
          };
        }),
      });
    }
  );
}
