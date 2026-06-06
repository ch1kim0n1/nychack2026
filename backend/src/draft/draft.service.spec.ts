import { Test, TestingModule } from '@nestjs/testing';
import { DraftService } from './draft.service';
import { OPENAI_CLIENT } from '../openai/openai.provider';

const mockCreate = jest.fn();

const baseDto = {
  affected_area: 'TABC Mixed Beverage Permit',
  explanation: 'Requires a TABC permit to serve alcohol.',
  recommended_action: 'Apply through TABC online portal.',
  source_url: 'https://www.tabc.texas.gov/services/tabc-licenses-permits/',
  business_description: 'Food truck in Dallas adding alcohol service.',
  who_to_contact: 'TABC Licensing Division',
  what_to_ask: 'What documents are required for a Mixed Beverage Permit?',
};

describe('DraftService', () => {
  let service: DraftService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftService,
        {
          provide: OPENAI_CLIENT,
          useValue: { chat: { completions: { create: mockCreate } } },
        },
      ],
    }).compile();
    service = module.get<DraftService>(DraftService);
  });

  it('generates an email draft with subject and body', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              subject: 'TABC Permit Inquiry',
              body: 'Dear TABC,\n\nI am writing...',
              agency_name: 'TABC',
            }),
          },
        },
      ],
    });

    const result = await service.generate({ ...baseDto, channel: 'email' });

    expect(result.channel).toBe('email');
    expect(result.subject).toBe('TABC Permit Inquiry');
    expect(result.body).toContain('TABC');
    expect(result.agency_name).toBe('TABC');
    expect(result.source_url).toBe(baseDto.source_url);
  });

  it('generates a call script draft', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              body: '[OPENING] Hi, my name is...',
              agency_name: 'TABC',
            }),
          },
        },
      ],
    });

    const result = await service.generate({
      ...baseDto,
      channel: 'call_script',
    });

    expect(result.channel).toBe('call_script');
    expect(result.body).toContain('OPENING');
  });

  it('calls OpenAI with a 30-second timeout', async () => {
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              body: 'Draft body',
              agency_name: 'TABC',
            }),
          },
        },
      ],
    });

    await service.generate({ ...baseDto, channel: 'email' });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini' }),
      expect.objectContaining({ timeout: 30_000 }),
    );
  });
});
