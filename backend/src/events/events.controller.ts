import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Public } from '../auth/public.decorator.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { ListEventsQueryDto } from './dto/list-events-query.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { EventsService } from './events.service.js';

@ApiTags('events')
@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get('events')
  @ApiOperation({ summary: 'List published events with search and filters' })
  @ApiResponse({ status: 200, description: 'Paginated published events' })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  list(@Query() query: ListEventsQueryDto) {
    return this.eventsService.listPublished(query);
  }

  @Public()
  @Get('events/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Event details (published events are public; drafts and cancelled events only for managers)' })
  @ApiResponse({ status: 200, description: 'The event' })
  @ApiResponse({ status: 404, description: 'Not found or not visible' })
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.eventsService.getById(id, user?.id);
  }

  @Post('organizations/:organizationId/events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a draft event (managers only)' })
  @ApiResponse({ status: 201, description: 'Draft event created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'Caller is not a manager' })
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.create(organizationId, user.id, dto);
  }

  @Patch('events/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a draft or published event (managers only)' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Caller is not a manager' })
  @ApiResponse({ status: 409, description: 'Event cannot be edited in its current state' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, user.id, dto);
  }

  @Post('events/:id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a draft event (managers only)' })
  @ApiResponse({ status: 403, description: 'Caller is not a manager' })
  @ApiResponse({ status: 409, description: 'Invalid lifecycle transition' })
  publish(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.eventsService.publish(id, user.id);
  }

  @Post('events/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a draft or published event (managers only)' })
  @ApiResponse({ status: 403, description: 'Caller is not a manager' })
  @ApiResponse({ status: 409, description: 'Invalid lifecycle transition' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.eventsService.cancel(id, user.id);
  }
}
