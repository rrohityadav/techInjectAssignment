import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const REFRESH_TOKEN_TTL_DAYS = 7;

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(email: string, password: string, role: Role) {
    const hash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({ data: { email, password: hash, role } });
  }

  async validate(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password);
    return ok ? user : null;
  }

  async login(user: { id: string; role: Role; email: string }, fastify: any) {
    const accessToken = fastify.jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      { expiresIn: '30m' }
    );

    const refreshToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string, fastify: any) {
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });
    if (!record || record.expiresAt < new Date()) return null;

    const payload = {
      id: record.user.id,
      role: record.user.role,
      email: record.user.email,
    };
    await this.prisma.refreshToken.delete({ where: { token: refreshToken } });

    return this.login(payload, fastify);
  }
}
