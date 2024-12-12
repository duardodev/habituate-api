import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import dayjs from 'dayjs';

export async function getCompletedHabitsCount(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().get(
    '/habits/completed/:date',
    {
      schema: {
        summary: 'Get the count of completed habits on the current date',
        tags: ['habits'],
        params: z.object({
          date: z.string().datetime(),
        }),
        response: {
          200: z.number(),
        },
      },
    },
    async (request, reply) => {
      const { date } = request.params;
      const dayDate = dayjs(date).toDate();

      const today = await prisma.day.findUnique({
        where: {
          date: dayDate,
        },
      });

      if (!today) {
        return reply.status(200).send(0);
      }

      const completedHabitsToday = await prisma.completedHabit.findMany({
        where: {
          dayId: today?.id,
          habit: {
            userId: request.userId,
          },
        },
        include: {
          habit: true,
        },
      });

      return reply.status(200).send(completedHabitsToday.length);
    }
  );
}
