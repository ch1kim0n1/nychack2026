import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactLeadDto } from './dto/contact-lead.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateContactLeadDto) {
    return this.contactService.create(dto);
  }
}
