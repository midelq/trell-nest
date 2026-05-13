import { Module, Global } from '@nestjs/common';
import { ActivityController } from './activity.controller.js';
import { ActivityService } from './activity.service.js';

@Global()
@Module({
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService]
})
export class ActivityModule {}
