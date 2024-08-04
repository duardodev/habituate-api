import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authMiddleware } from '../utils/auth-middleware';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function deleteHabit(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().delete(
    '/habits/:id',
    {
      schema: {
        summary: 'Delete a habit',
        tags: ['habits'],
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

      const habit = await prisma.habit.findFirstOrThrow({
        where: {
          id,
        },
      });

      if (habit.userId != request.userId) {
        return reply.status(401).send();
      }

      await prisma.completedHabit.deleteMany({
        where: {
          habitId: id,
        },
      });

      await prisma.habit.delete({
        where: {
          id: id,
        },
      });

      return reply.status(200).send();
    }
  );
}
