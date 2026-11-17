import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { isUniqueViolation } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AddMemberDto } from './dto/add-member.dto.js';
import type { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { OrganizationAccessService } from './organization-access.service.js';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: OrganizationAccessService,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    try {
      // Nested create runs as one transaction: organization and creator's manager role.
      const organization = await this.prisma.organization.create({
        data: {
          name: dto.name,
          description: dto.description,
          createdById: userId,
          memberships: { create: { userId, role: MembershipRole.MANAGER } },
        },
        select: { id: true, name: true, description: true, createdAt: true },
      });
      return { ...organization, role: MembershipRole.MANAGER };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'An organization with this name already exists',
        );
      }
      throw error;
    }
  }

  async addMember(
    organizationId: string,
    actingUserId: string,
    dto: AddMemberDto,
  ) {
    await this.access.assertManager(actingUserId, organizationId);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('No user found with this email');
    }

    try {
      const membership = await this.prisma.membership.create({
        data: { userId: user.id, organizationId, role: dto.role },
        select: { userId: true, organizationId: true, role: true },
      });
      return membership;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'This user is already a member of the organization',
        );
      }
      throw error;
    }
  }
}
