import { Module } from '@nestjs/common';
import { OrganizationAccessService } from './organization-access.service.js';
import { OrganizationsController } from './organizations.controller.js';
import { OrganizationsService } from './organizations.service.js';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrganizationAccessService],
  exports: [OrganizationAccessService],
})
export class OrganizationsModule {}
