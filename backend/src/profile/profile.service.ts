import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from '../openai/openai.provider';

export interface BusinessProfile {
  industry: string;
  location: string;
  expansion_locations: string[];
  activities: string[];
  employees: number | null;
}

@Injectable()
export class ProfileService {
  constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {}

  async classify(input: string): Promise<BusinessProfile> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a business classification assistant for Texas regulatory compliance.
Extract structured information from the user's description. Return ONLY valid JSON — no markdown, no explanation.
Return exactly this shape:
{
  "industry": "food_service|retail|cosmetology|construction|childcare|other",
  "location": "City, TX",
  "expansion_locations": ["City, TX"],
  "activities": ["food_preparation", "alcohol_planned", "outdoor_seating", "nail_services", etc],
  "employees": number or null
}`,
        },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
    }, { timeout: 30_000 });

    const content = response.choices[0]?.message.content;
    if (!content) {
      throw new InternalServerErrorException(
        'Classification returned empty response',
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new InternalServerErrorException(
        'Classification returned invalid JSON',
      );
    }

    return this.validateProfile(parsed);
  }

  private validateProfile(parsed: unknown): BusinessProfile {
    if (!parsed || typeof parsed !== 'object') {
      throw new UnprocessableEntityException(
        'Classification returned malformed profile',
      );
    }

    const profile = parsed as Record<string, unknown>;
    if (typeof profile.industry !== 'string' || !profile.industry.trim()) {
      throw new UnprocessableEntityException(
        'Could not extract industry from description',
      );
    }
    if (typeof profile.location !== 'string' || !profile.location.trim()) {
      throw new UnprocessableEntityException(
        'Could not extract location from description',
      );
    }
    if (
      profile.employees !== null &&
      profile.employees !== undefined &&
      typeof profile.employees !== 'number'
    ) {
      throw new UnprocessableEntityException(
        'Could not extract employee count from description',
      );
    }

    return {
      industry: profile.industry,
      location: profile.location,
      expansion_locations: this.asStringArray(profile.expansion_locations),
      activities: this.asStringArray(profile.activities),
      employees: profile.employees ?? null,
    };
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
  }
}
