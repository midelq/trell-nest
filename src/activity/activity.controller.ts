import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @ApiOperation({ summary: 'Отримати останні активності для дошки' })
  @Get('board/:boardId')
  async getActivitiesByBoard(@Param('boardId', ParseIntPipe) boardId: number) {
    const activities = await this.activityService.getActivitiesByBoard(boardId);
    return {
      activities,
      count: activities.length,
    };
  }
}
