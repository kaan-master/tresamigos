import { BadRequestException, Injectable } from "@nestjs/common";
import type { ContactSubmitInput } from "@tresamigos/types";
import { cleanText } from "@tresamigos/utils";
import { ContentService } from "../content/content.service";
import { MailService } from "../mail/mail.service";

@Injectable()
export class ContactService {
  constructor(
    private readonly contentService: ContentService,
    private readonly mailService: MailService
  ) {}

  async submit(input: ContactSubmitInput) {
    const name = cleanText(input?.name, "", 120);
    const email = cleanText(input?.email, "", 180).toLowerCase();
    const subject = cleanText(input?.subject, "", 160);
    const message = cleanText(input?.message, "", 4000);

    if (!name || !email || !email.includes("@") || !message) {
      throw new BadRequestException({ message: "Vul naam, e-mail en bericht in." });
    }

    const content = await this.contentService.getContent();
    const form = content.site.contactForm;
    const mail = content.site.mailRelay;

    if (!form.enabled) {
      throw new BadRequestException({ message: "Het contactformulier is momenteel niet beschikbaar." });
    }

    const inbox = content.site.footer.email || mail.replyTo;
    const emailed =
      this.mailService.isConfigured() &&
      (await this.mailService.sendContactEmail({
        to: inbox,
        fromName: mail.fromName,
        replyTo: mail.replyTo,
        subject: `${form.notifySubject}${subject ? `: ${subject}` : ""}`,
        name,
        email,
        topic: subject || "General question",
        message
      }));

    return {
      message: form.successMessage,
      emailed
    };
  }
}
