import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from './contact.service';
import { PrismaService } from '../database/prisma.service';

const mockPrisma = {
  contactLead: {
    create: jest.fn(),
  },
};

describe('ContactService', () => {
  let service: ContactService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
  });

  it('persists a lead via prisma', async () => {
    const dto = { name: 'Alice', email: 'alice@example.com' };
    mockPrisma.contactLead.create.mockResolvedValue({ id: 'abc', ...dto });

    const result = await service.create(dto);
    expect(result.id).toBe('abc');
    expect(mockPrisma.contactLead.create).toHaveBeenCalledWith({ data: dto });
  });
});
