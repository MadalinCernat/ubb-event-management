import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RegistrationsService } from './registrations.service.js';

@ApiTags('registrations')
@ApiBearerAuth()
@Controller()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('events/:id/registrations')
  @ApiOperation({ summary: 'Register the current user for an event' })
  @ApiResponse({ status: 201, description: 'Registered' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Duplicate, full, started, cancelled or unpublished event' })
  register(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.registrationsService.register(id, user.id);
  }

  @Delete('events/:id/registrations/me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Cancel the current user's own registration" })
  @ApiResponse({ status: 204, description: 'Registration cancelled' })
  @ApiResponse({ status: 404, description: 'No active registration' })
  @ApiResponse({ status: 409, description: 'Event already started' })
  cancelOwn(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.registrationsService.cancelOwn(id, user.id);
  }

  @Get('registrations/me')
  @ApiOperation({ summary: "List the current user's active registrations" })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  listOwn(@CurrentUser() user: AuthUser) {
    return this.registrationsService.listOwn(user.id);
  }
}
