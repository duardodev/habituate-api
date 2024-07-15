import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import dayjs from 'dayjs';

export async function habitsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async request => {
    await request.jwtVerify();
  });

  app.post('/habits', async (request: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      title: z.string(),
    });

    const { title } = bodySchema.parse(request.body);

    const habit = await prisma.habit.create({
      data: {
        title,
        userId: request.user.sub,
      },
    });

    return reply.status(201).send(habit);
  });

  app.get('/habits', async (request: FastifyRequest, reply: FastifyReply) => {
    const habits = await prisma.habit.findMany({
      where: {
        userId: request.user.sub,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return reply.status(200).send(habits);
  });

  app.delete('/habits/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({
      id: z.string(),
    });

    const { id } = paramsSchema.parse(request.params);

    const habit = await prisma.habit.findFirstOrThrow({
      where: {
        id,
      },
    });

    if (habit.userId != request.user.sub) {
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

    return reply.status(204).send();
  });

  app.put('/habits/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({
      id: z.string(),
    });

    const bodySchema = z.object({
      title: z.string(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { title } = bodySchema.parse(request.body);

    const habit = await prisma.habit.findFirstOrThrow({
      where: {
        id,
      },
    });

    if (habit.userId != request.user.sub) {
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

    reply.status(204).send();
  });

  app.patch('/habits/:id/toggle', async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({
      id: z.string(),
    });

    const bodySchema = z.object({
      date: z.string().datetime(),
    });

    const { id } = paramsSchema.parse(request.params);
    const { date } = bodySchema.parse(request.body);
    const dayDate = dayjs(date).startOf('day').toDate();

    const habit = await prisma.habit.findFirstOrThrow({
      where: {
        id,
      },
    });

    if (habit.userId != request.user.sub) {
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

    reply.status(201).send();
  });

  app.get('/completed-habits/:id/days', async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({
      id: z.string(),
    });

    const { id } = paramsSchema.parse(request.params);

    const habit = await prisma.habit.findFirstOrThrow({
      where: {
        id,
      },
    });

    if (habit.userId != request.user.sub) {
      return reply.status(401).send();
    }

    const daysWithSpecificHabitCompleted = await prisma.day.findMany({
      where: {
        completedHabits: {
          some: {
            habitId: id,
          },
        },
      },
    });

    return reply.status(200).send(daysWithSpecificHabitCompleted);
  });
}
