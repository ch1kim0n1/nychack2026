import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { CreateDraftDto } from './dto/create-draft.dto';

export interface DraftResult {
  channel: 'email' | 'call_script' | 'landlord';
  subject?: string;
  body: string;
  agency_name: string;
  source_url: string;
}

@Injectable()
export class DraftService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async generate(dto: CreateDraftDto): Promise<DraftResult> {
    const channel = dto.channel ?? 'email';

    const channelInstructions: Record<typeof channel, string> = {
      email: `Write a concise, professional email to the relevant government agency.
Include: subject line, greeting, 2-3 sentences of context (business type and situation),
the specific question or request, and a professional sign-off.
The tone is polite and business-like — not formal legal language, not casual.`,
      call_script: `Write a short phone call script (under 90 seconds when read aloud).
Include: opening (name + reason for calling), 1-2 sentences of context,
the specific question, and a polite close asking for follow-up options.
Format: [OPENING], [CONTEXT], [QUESTION], [CLOSE]`,
      landlord: `Write a list of 3-5 direct questions to ask a potential landlord or property manager
before signing a lease, focused on whether the property allows this business activity.
Each question should be specific, not vague. Format as a numbered list.`,
    };

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a plain-English business writing assistant helping a Texas small business owner
communicate with government agencies, landlords, or licensing offices about a specific compliance requirement.

RULES:
- Ground every statement in the provided finding context — do not invent facts
- The source_url in the finding is the official reference; cite the agency name but not the full URL in the draft body
- Never provide legal advice — you are helping the owner ask the right question, not answer it
- Return ONLY valid JSON, no markdown

Return:
{
  "subject": "email subject line (email channel only, omit otherwise)",
  "body": "the drafted content",
  "agency_name": "the name of the agency or contact being addressed"
}`,
        },
        {
          role: 'user',
          content: `COMPLIANCE FINDING:
Area: ${dto.affected_area}
Explanation: ${dto.explanation}
Recommended action: ${dto.recommended_action}
Agency/contact: ${dto.who_to_contact ?? 'the relevant agency'}
Specific question to ask: ${dto.what_to_ask ?? 'what are the requirements and how do I comply?'}
Source reference: ${dto.source_url}

BUSINESS DESCRIPTION: ${dto.business_description}

CHANNEL: ${channel}

${channelInstructions[channel]}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0].message.content ?? '{}') as {
      subject?: string;
      body?: string;
      agency_name?: string;
    };

    return {
      channel,
      subject: parsed.subject,
      body: parsed.body ?? '',
      agency_name: parsed.agency_name ?? dto.who_to_contact ?? 'Agency',
      source_url: dto.source_url,
    };
  }
}
