import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { OrganizationAccessService } from './organization-access.service.js';
import { OrganizationsService } from './organizations.service.js';

describe('OrganizationsService', () => {
  function setup() {
    const prisma = {
      organization: { create: vi.fn() },
      user: { findUnique: vi.fn() },
      membership: { create: vi.fn() },
    };
    const access = { assertManager: vi.fn() };
    return {
      prisma,
      access,
      service: new OrganizationsService(prisma as never, access as never),
    };
  }

  it('makes the creator a manager of the new organization', async () => {
    const { prisma, service } = setup();
    prisma.organization.create.mockResolvedValue({ id: 'o1', name: 'Org' });

    const result = await service.create('u1', { name: 'Org', description: 'D' });

    expect(prisma.organization.create.mock.calls[0][0].data).toMatchObject({
      createdById: 'u1',
      memberships: { create: { userId: 'u1', role: MembershipRole.MANAGER } },
    });
    expect(result.role).toBe(MembershipRole.MANAGER);
  });

  it('rejects a duplicate organization name with 409', async () => {
    const { prisma, service } = setup();
    prisma.organization.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.create('u1', { name: 'Org', description: 'D' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('only lets managers add members', async () => {
    const { prisma, access, service } = setup();
    access.assertManager.mockRejectedValue(new ForbiddenException());

    await expect(
      service.addMember('o1', 'u2', { email: 'a@b.com', role: MembershipRole.MEMBER }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.membership.create).not.toHaveBeenCalled();
  });

  it('adds an existing user with the requested role', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValue({ id: 'u3' });
    prisma.membership.create.mockResolvedValue({
      userId: 'u3',
      organizationId: 'o1',
      role: MembershipRole.MEMBER,
    });

    await service.addMember('o1', 'u1', { email: 'a@b.com', role: MembershipRole.MEMBER });

    expect(prisma.membership.create.mock.calls[0][0].data).toEqual({
      userId: 'u3',
      organizationId: 'o1',
      role: MembershipRole.MEMBER,
    });
  });

  it('returns 404 for an unknown email and 409 for an existing member', async () => {
    const { prisma, service } = setup();
    prisma.user.findUnique.mockResolvedValueOnce(null);
    await expect(
      service.addMember('o1', 'u1', { email: 'x@y.com', role: MembershipRole.MEMBER }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.user.findUnique.mockResolvedValueOnce({ id: 'u3' });
    prisma.membership.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.addMember('o1', 'u1', { email: 'a@b.com', role: MembershipRole.MEMBER }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('OrganizationAccessService', () => {
  function setup(role: MembershipRole | null, organizationExists = true) {
    const prisma = {
      membership: {
        findUnique: vi.fn().mockResolvedValue(role ? { role } : null),
      },
      organization: {
        findUnique: vi.fn().mockResolvedValue(organizationExists ? { id: 'o1' } : null),
      },
    };
    return new OrganizationAccessService(prisma as never);
  }

  it('accepts managers', async () => {
    await expect(setup(MembershipRole.MANAGER).assertManager('u1', 'o1')).resolves.toBeUndefined();
  });

  it('rejects plain members and non-members with 403', async () => {
    await expect(setup(MembershipRole.MEMBER).assertManager('u1', 'o1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(setup(null).assertManager('u1', 'o1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('returns 404 when the organization does not exist', async () => {
    await expect(setup(null, false).assertManager('u1', 'o1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
