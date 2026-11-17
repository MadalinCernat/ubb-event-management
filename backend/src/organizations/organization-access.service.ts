import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

// Single place for organization-level authorization decisions.
@Injectable()
export class OrganizationAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async isManager(userId: string, organizationId: string): Promise<boolean> {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
      select: { role: true },
    });
    return membership?.role === MembershipRole.MANAGER;
  }

  async assertManager(userId: string, organizationId: string): Promise<void> {
    if (await this.isManager(userId, organizationId)) {
      return;
    }
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    throw new ForbiddenException(
      'You must be a manager of this organization to do this',
    );
  }
}
