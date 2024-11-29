import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function createTask(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().post(
    '/tasks',
    {
      schema: {
        summary: 'Create a task',
        tags: ['tasks'],
        body: z.object({
          title: z.string(),
          priority: z.string(),
        }),
        response: {
          201: z.object({
            id: z.string(),
            title: z.string(),
            userId: z.string(),
            priority: z.string(),
            completed: z.boolean(),
            createdAt: z.date(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { title, priority } = request.body;

      const task = await prisma.task.create({
        data: {
          title,
          priority,
          userId: request.userId!,
          completed: false,
        },
      });

      return reply.status(201).send(task);
    }
  );
}
