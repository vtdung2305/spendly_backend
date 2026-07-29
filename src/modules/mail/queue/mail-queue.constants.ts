export const MAIL_QUEUE = 'emails';

export enum MailJob {
  PASSWORD_RESET = 'password-reset',
}

export interface PasswordResetJobData {
  email: string;
  firstName: string;
  token: string;
}
