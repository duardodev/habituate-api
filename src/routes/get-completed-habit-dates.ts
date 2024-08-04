import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function getCompletedHabitDates(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().patch(
    '/completed-habits/:id/days',
    {
      schema: {
        summary: 'Get dates a habit was completed',
        tags: ['habits'],
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            datesTheHabitWasCompleted: z.array(
              z.object({
                id: z.string(),
                date: z.date(),
              })
            ),
          }),
          401: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;

      const habit = await prisma.habit.findFirstOrThrow({
        where: {
          id,
        },
      });

      if (habit.userId != request.userId) {
        return reply.status(401).send();
      }

      const datesTheHabitWasCompleted = await prisma.day.findMany({
        where: {
          completedHabits: {
            some: {
              habitId: id,
            },
          },
        },
      });

      return reply.status(200).send({
        datesTheHabitWasCompleted: datesTheHabitWasCompleted.map(dateTheHabitWasCompleted => {
          return {
            id: dateTheHabitWasCompleted.id,
            date: dateTheHabitWasCompleted.date,
          };
        }),
      });
    }
  );
}
