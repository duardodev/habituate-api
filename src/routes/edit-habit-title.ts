import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { authMiddleware } from '../utils/auth-middleware';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function editHabitTitle(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().put(
    '/habits/:id',
    {
      schema: {
        summary: 'Edit the title of a habit',
        tags: ['habits'],
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          title: z.string(),
        }),
        response: {
          200: z.null(),
          401: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params;
      const { title } = request.body;

      const habit = await prisma.habit.findFirstOrThrow({
        where: {
          id,
        },
      });

      if (habit.userId != request.userId) {
        return reply.status(401).send();
      }

      await prisma.habit.update({
        where: {
          id,
        },
        data: {
          title,
        },
      });

      reply.status(200).send();
    }
  );
}
