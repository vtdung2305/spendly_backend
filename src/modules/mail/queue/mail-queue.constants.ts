export const MAIL_QUEUE = 'emails';

export enum MailJob {
  PASSWORD_RESET = 'password-reset',
  EMAIL_OTP = 'email-otp',
}

export interface PasswordResetJobData {
  email: string;
  firstName: string;
  token: string;
}

export interface EmailOtpJobData {
  email: string;
  firstName: string;
  code: string;
}
