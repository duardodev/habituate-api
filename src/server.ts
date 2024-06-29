import fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { habitsRoutes } from './routes/habits';
import { authRoutes } from './routes/auth';

const app = fastify();

app.register(cors, {
  origin: process.env.CORS_ORIGIN,
});

app.register(jwt, {
  secret: process.env.JWT_SECRET!,
});

app.register(authRoutes);
app.register(habitsRoutes);

app
  .listen({
    host: '0.0.0.0',
    port: process.env.PORT ? Number(process.env.PORT) : 3333,
  })
  .then(() => {
    console.log('HTTP Server Running');
  });
