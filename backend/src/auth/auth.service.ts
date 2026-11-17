import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/prisma-errors.js';
import { hashPassword, verifyPassword } from '../common/password.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { TokenService } from './token.service.js';

// Compared against when the email is unknown so login timing does not reveal it.
const DUMMY_HASH = hashPassword('not-a-real-password');

interface UserView {
  id: string;
  email: string;
  displayName: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          displayName: dto.displayName,
          passwordHash: hashPassword(dto.password),
        },
        select: { id: true, email: true, displayName: true },
      });
      return this.session(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const passwordMatches = verifyPassword(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.session(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        memberships: {
          select: {
            role: true,
            organization: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      memberships: user.memberships.map((membership) => ({
        organizationId: membership.organization.id,
        organizationName: membership.organization.name,
        role: membership.role,
      })),
    };
  }

  private session(user: UserView) {
    return {
      ...this.tokens.sign(user.id),
      tokenType: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }
}
