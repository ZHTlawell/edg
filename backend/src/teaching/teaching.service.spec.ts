import { Test, TestingModule } from '@nestjs/testing';
import { TeachingService } from './teaching.service';

describe('TeachingService', () => {
  let service: TeachingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TeachingService],
    }).compile();

    service = module.get<TeachingService>(TeachingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
