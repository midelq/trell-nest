import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service.js';

@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService] // 👈 Експортуємо, щоб інші модулі могли використовувати
})
export class EmailModule {}
