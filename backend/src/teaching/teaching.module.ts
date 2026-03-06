import { Module } from '@nestjs/common';
import { TeachingService } from './teaching.service';
import { TeachingController } from './teaching.controller';

@Module({
  providers: [TeachingService],
  controllers: [TeachingController]
})
export class TeachingModule {}
