import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authMiddleware } from '../utils/auth-middleware';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function createHabit(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().post(
    '/habits',
    {
      schema: {
        summary: 'Create a habit',
        tags: ['habits'],
        body: z.object({
          title: z.string(),
        }),
        response: {
          201: z.object({
            id: z.string(),
            title: z.string(),
            userId: z.string(),
            createdAt: z.date(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { title } = request.body;

      const habit = await prisma.habit.create({
        data: {
          title,
          userId: request.userId!,
          emoji: '1fab4',
        },
      });

      return reply.status(201).send(habit);
    }
  );
}
