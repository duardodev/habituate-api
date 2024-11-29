import * as dotenv from 'dotenv';
dotenv.config();

import fastify from 'fastify';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { createHabit } from './routes/create-habit';
import { getHabits } from './routes/get-habits';
import { deleteHabit } from './routes/delete-habit';
import { editHabitTitle } from './routes/edit-habit-title';
import { toggleHabit } from './routes/toggle-habit';
import { getCompletedHabitDates } from './routes/get-completed-habit-dates';
import { clerkPlugin } from '@clerk/fastify';
import { createTask } from './routes/create-task';
import { getTasks } from './routes/get-tasks';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.register(cors, {
  origin: process.env.CORS_ORIGIN,
});

app.register(fastifySwagger, {
  swagger: {
    consumes: ['application/json'],
    produces: ['application/json'],
    info: {
      title: 'Habituate',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(clerkPlugin, {
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
});

app.register(createHabit);
app.register(getHabits);
app.register(editHabitTitle);
app.register(toggleHabit);
app.register(getCompletedHabitDates);
app.register(deleteHabit);
app.register(createTask);
app.register(getTasks);

app
  .listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
  })
  .then(() => {
    console.log('HTTP Server Running');
  });
