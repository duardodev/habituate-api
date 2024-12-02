import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../utils/auth-middleware';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export async function editTaskTitle(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.withTypeProvider<ZodTypeProvider>().put(
    '/tasks/:id',
    {
      schema: {
        summary: 'Edit the title of a task',
        tags: ['tasks'],
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

      const task = await prisma.task.findFirstOrThrow({
        where: {
          id,
        },
      });

      if (task.userId !== request.userId) {
        return reply.status(401).send();
      }

      await prisma.task.update({
        where: {
          id: task.id,
        },
        data: {
          title,
        },
      });

      reply.status(200).send();
    }
  );
}
