import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { OrganizationsService } from './organizations.service.js';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an organization; the creator becomes its manager' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 409, description: 'Organization name already used' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user.id, dto);
  }

  @Post(':organizationId/members')
  @ApiOperation({ summary: 'Add an existing user to the organization (managers only)' })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Caller is not a manager' })
  @ApiResponse({ status: 404, description: 'Organization or user not found' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  addMember(
    @CurrentUser() user: AuthUser,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.organizationsService.addMember(organizationId, user.id, dto);
  }
}
