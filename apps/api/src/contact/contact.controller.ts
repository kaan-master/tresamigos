import { Body, Controller, Post } from "@nestjs/common";
import type { ContactSubmitInput } from "@tresamigos/types";
import { ContactService } from "./contact.service";

@Controller("api")
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post("contact")
  submit(@Body() body: ContactSubmitInput) {
    return this.contactService.submit(body);
  }
}
