import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export interface BusinessProfile {
  industry: string;
  location: string;
  expansion_locations: string[];
  activities: string[];
  employees: number | null;
}

@Injectable()
export class ProfileService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    return JSON.parse(response.choices[0].message.content!) as BusinessProfile;
  }
}
