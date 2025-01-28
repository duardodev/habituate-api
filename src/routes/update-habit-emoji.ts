import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function updateHabitEmoji(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().patch(
    '/habits/:id/emoji',
    {
      schema: {
        summary: 'Add emoji to a habit',
        tags: ['habits'],
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          emoji: z.string(),
        }),
        response: {
          200: z.null().describe('Emoji added'),
          404: z.null().describe('Habit not found'),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { emoji } = request.body;

      const habit = await prisma.habit.findFirstOrThrow({
        where: {
          id,
        },
      });

      if (habit.userId != request.userId) {
        return reply.status(404).send();
      }

      await prisma.habit.update({
        where: {
          id: habit.id,
        },
        data: {
          emoji,
        },
      });

      return reply.status(200).send();
    }
  );
}
