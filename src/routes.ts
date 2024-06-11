import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../src/lib/prisma';
import { z } from 'zod';
import dayjs from 'dayjs';

export async function appRoutes(app: FastifyInstance) {
  app.post('/habits', async (request: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      title: z.string(),
    });

    const { title } = bodySchema.parse(request.body);

    const habit = await prisma.habit.create({
      data: {
        title,
        userId: 'duardodev',
      },
    });

    return reply.status(201).send(habit);
  });

  app.get('/habits', async (request: FastifyRequest, reply: FastifyReply) => {
    const habits = await prisma.habit.findMany({
      where: {
        userId: 'duardodev',
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

    await prisma.habit.delete({
      where: {
        id,
        userId: 'duardodev',
      },
    });

    reply.status(204).send();
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

    await prisma.habit.update({
      where: {
        id,
        userId: 'duardodev',
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
    }

    reply.status(201).send();
  });

  app.get('/days/habits/completed', async (request: FastifyRequest, reply: FastifyReply) => {
    const daysWithCompletedHabits = await prisma.day.findMany({
      where: {
        completedHabits: {
          some: {},
        },
      },
      include: {
        completedHabits: true,
      },
    });

    return reply.status(200).send(daysWithCompletedHabits);
  });
}
