import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import dayjs from 'dayjs';

export async function toggleHabit(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().patch(
    '/habits/:id/toggle',
    {
      schema: {
        summary: 'Toggle a habit to completed or not completed',
        tags: ['habits'],
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          date: z.string().datetime(),
        }),
        response: {
          200: z.null(),
          401: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { date } = request.body;

      const dayDate = dayjs(date).toDate();

      const habit = await prisma.habit.findFirstOrThrow({
        where: {
          id,
        },
      });

      if (habit.userId != request.userId) {
        return reply.status(401).send();
      }

      let day = await prisma.day.findUnique({
        where: {
          date: dayDate,
        },
      });

      if (!day) {
        day = await prisma.day.create({
          data: {
            date: dayDate,
          },
        });
      }

      let completedHabit = await prisma.completedHabit.findUnique({
        where: {
          habitId_dayId: {
            habitId: id,
            dayId: day.id,
          },
        },
      });

      if (!completedHabit) {
        completedHabit = await prisma.completedHabit.create({
          data: {
            habitId: id,
            dayId: day.id,
          },
        });
      } else {
        completedHabit = await prisma.completedHabit.delete({
          where: {
            habitId_dayId: {
              habitId: id,
              dayId: day.id,
            },
          },
        });

        const remainingCompletedHabits = await prisma.completedHabit.findMany({
          where: {
            dayId: day.id,
          },
        });

        if (remainingCompletedHabits.length === 0) {
          await prisma.day.delete({
            where: {
              id: day.id,
            },
          });
        }
      }

      reply.status(200).send();
    }
  );
}
