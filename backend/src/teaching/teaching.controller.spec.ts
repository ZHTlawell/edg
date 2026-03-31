import { Test, TestingModule } from '@nestjs/testing';
import { TeachingController } from './teaching.controller';

describe('TeachingController', () => {
  let controller: TeachingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachingController],
    }).compile();

    controller = module.get<TeachingController>(TeachingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
