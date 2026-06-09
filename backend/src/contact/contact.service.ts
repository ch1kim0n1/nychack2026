import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateContactLeadDto } from './dto/contact-lead.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContactLeadDto) {
    return this.prisma.contactLead.create({ data: dto });
  }
}
