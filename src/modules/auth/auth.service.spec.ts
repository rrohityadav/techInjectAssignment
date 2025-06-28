import { AuthService } from './auth.service';
import { PrismaClient, Role, User, RefreshToken } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomUUID: jest.fn(() => 'uuid-1234'),
  };
});
jest.useFakeTimers().setSystemTime(new Date('2025-06-28T00:00:00Z'));

describe('AuthService', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;
  let service: AuthService;
  let fastify: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    } as any;

    service = new AuthService(mockPrisma);
    fastify = {
      jwt: { sign: jest.fn().mockReturnValue('signed-access-token') },
    };

    // stub randomUUID to a predictable value
    jest.spyOn(crypto, 'randomUUID').mockReturnValue('uuid-1234');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('hashes the password and creates a user', async () => {
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-pw');
      const fakeUser: User = {
        id: 'u1',
        email: 'a@b.com',
        password: 'hashed-pw',
        role: Role.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.create.mockResolvedValue(fakeUser);

      const result = await service.register('a@b.com', 'plain-pw', Role.ADMIN);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-pw', 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: { email: 'a@b.com', password: 'hashed-pw', role: Role.ADMIN },
      });
      expect(result).toBe(fakeUser);
    });
  });

  describe('validate', () => {
    it('returns null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      const res = await service.validate('x@x.com', 'pw');
      expect(res).toBeNull();
    });

    it('returns null when password does not match', async () => {
      const fakeUser: any = { id: 'u', email: 'e', password: 'hash' };
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const res = await service.validate('e', 'wrong');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'hash');
      expect(res).toBeNull();
    });

    it('returns user when password matches', async () => {
      const fakeUser: any = { id: 'u', email: 'e', password: 'hash' };
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const res = await service.validate('e', 'right');
      expect(res).toBe(fakeUser);
    });
  });

  describe('login', () => {
    it('signs JWT, creates a refresh token, and returns both tokens', async () => {
      const user = { id: 'u1', role: Role.SELLER, email: 'a@b.com' };

      const fakeRefresh: RefreshToken = {
        token: 'uuid-1234',
        userId: 'u1',
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      };
      mockPrisma.refreshToken.create.mockResolvedValue(fakeRefresh);

      const { accessToken, refreshToken } = await service.login(user, fastify);

      expect(fastify.jwt.sign).toHaveBeenCalledWith(
        { id: 'u1', role: Role.SELLER, email: 'a@b.com' },
        { expiresIn: '30m' }
      );
      expect(crypto.randomUUID).toHaveBeenCalled();
      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith({
        data: {
          token: 'uuid-1234',
          userId: 'u1',
          expiresAt: expect.any(Date),
        },
      });
      expect(accessToken).toBe('signed-access-token');
      expect(refreshToken).toBe('uuid-1234');
    });
  });

  describe('refresh', () => {
    it('returns null if token not found', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);
      const res = await service.refresh('tok', fastify);
      expect(res).toBeNull();
    });

    it('returns null if token expired', async () => {
      const record: any = {
        token: 'tok',
        expiresAt: new Date(Date.now() - 1000),
        user: { id: 'u', role: Role.ADMIN, email: 'x@x.com' },
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(record);
      const res = await service.refresh('tok', fastify);
      expect(res).toBeNull();
    });

    it('deletes old token and issues new tokens when valid', async () => {
      const future = new Date(Date.now() + 1000);
      const record: any = {
        token: 'oldtok',
        expiresAt: future,
        user: { id: 'u2', role: Role.SELLER, email: 'y@z.com' },
      };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(record);
      mockPrisma.refreshToken.delete.mockResolvedValue({} as any);
      const loginSpy = jest.spyOn(service, 'login').mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const res = await service.refresh('oldtok', fastify);

      expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { token: 'oldtok' } });
      expect(loginSpy).toHaveBeenCalledWith(
        { id: 'u2', role: Role.SELLER, email: 'y@z.com' },
        fastify
      );
      expect(res).toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    });
  });
});
