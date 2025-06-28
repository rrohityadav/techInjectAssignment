import  fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

type RoleStr = 'ADMIN' | 'SELLER';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    authorize(requiredRole: RoleStr): (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

export default fp(async function (server: FastifyInstance) {
  server.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  );

  server.decorate(
    'authorize',
    (requiredRole: RoleStr) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        const user = request.user as { role: RoleStr };
        if (user.role !== requiredRole && user.role !== 'ADMIN') {
          return reply.code(403).send({ message: 'Forbidden' });
        }
      }
  );
});
