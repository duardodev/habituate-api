import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authMiddleware } from '../utils/auth-middleware';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function getHabits(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().get(
    '/habits',
    {
      schema: {
        summary: 'Get habits',
        tags: ['habits'],
        response: {
          200: z.object({
            habits: z.array(
              z.object({
                id: z.string(),
                userId: z.string(),
                title: z.string(),
                emoji: z.string(),
                createdAt: z.date(),
              })
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const habits = await prisma.habit.findMany({
        where: {
          userId: request.userId,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return reply.status(200).send({
        habits: habits.map(habit => {
          return {
            id: habit.id,
            title: habit.title,
            emoji: habit.emoji,
            userId: habit.userId,
            createdAt: habit.createdAt,
          };
        }),
      });
    }
  );
}
