import 'fastify';
import { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Verifies the JWT and populates `request.user`
     */
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;

    /**
     * Returns a preHandler that checks `request.user.role`
     */
    authorize(role: 'ADMIN' | 'SELLER'): (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}
