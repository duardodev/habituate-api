import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const bodySchema = z.object({
      code: z.string(),
    });

    const { code } = bodySchema.parse(request.body);

    const data = new URLSearchParams();
    data.append('client_id', process.env.GITHUB_CLIENT_ID as string);
    data.append('client_secret', process.env.GITHUB_CLIENT_SECRET as string);
    data.append('code', code);

    const accessTokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: data,
    });

    const { access_token } = await accessTokenResponse.json();

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userData = await userResponse.json();

    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
      email: z.string().email(),
      avatar_url: z.string().url(),
      login: z.string(),
    });

    const userInfo = userSchema.parse(userData);

    let user = await prisma.user.findUnique({
      where: {
        githubId: userInfo.id,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          githubId: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          avatarUrl: userInfo.avatar_url,
          login: userInfo.login,
        },
      });
    }

    const token = app.jwt.sign(
      {
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      {
        sub: user.id,
        expiresIn: '30 days',
      }
    );

    return {
      token,
    };
  });
}
