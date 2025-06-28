import { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient, Role } from '@prisma/client';
import { AuthService } from './auth.service';

export default async function authRoutes(
  fastify: FastifyInstance,
  options: { prisma: PrismaClient }
) {
  const service = new AuthService(options.prisma);
  fastify.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Register a user',
      body: {
        type: 'object',
        required: ['email', 'password', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', enum: ['ADMIN', 'SELLER'] }
        }
      },
      response: {
        201: {
          description: 'User registered successfully',
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            createdAt: { type: 'string' }
          }
        },
        400: {
          description: 'Invalid input',
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password, role } = request.body as {
        email: string;
        password: string;
        role: Role;
      };

      const user = await service.register(email, password, role);
      const { password: _, ...userSafe } = user;
      return reply.code(201).send(userSafe);
    } catch (error:any) {
      return reply.code(400).send({
        message: error.message
      });
    }
  });
// Login Route
  fastify.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Login a user',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: { message: { type: 'string' } }
        }
      }
    }
  }, async (request:FastifyRequest< { Body: { email: string; password: string } }>, reply) => {
    try {
      const { email, password } = request.body;

      const user = await service.validate(email, password);
      if (!user) {
        return reply.status(401).send({ message: 'Invalid credentials' });
      }

      const tokens = await service.login(user, fastify);
      return reply.send(tokens);
    } catch (error) {
      return reply.status(400).send({ message: 'Login failed' });
    }
  });

// Refresh Route
  fastify.post('/refresh', {
    schema: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: { message: { type: 'string' } }
        }
      }
    }
  }, async (request:FastifyRequest< { Body: { refreshToken: string } }>, reply) => {
    try {
      const { refreshToken } = request.body;

      if (!refreshToken) {
        return reply.status(400).send({ message: 'Refresh token required' });
      }

      const tokens = await service.refresh(refreshToken, fastify);
      if (!tokens) {
        return reply.status(401).send({ message: 'Invalid refresh token' });
      }

      return reply.send(tokens);
    } catch (error) {
      return reply.status(400).send({ message: 'Refresh failed' });
    }
  });

// Error handling middleware (add this to your main app file)
  fastify.setErrorHandler(function (error, request, reply) {
    fastify.log.error(error);

    // Handle validation errors
    if (error.validation) {
      reply.status(400).send({
        message: 'Validation error',
        details: error.validation
      });
      return;
    }

    // Handle other errors
    reply.status(500).send({
      message: 'Internal Server Error'
    });
  });
}
