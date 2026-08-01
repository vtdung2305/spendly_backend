export const DAILY_REMINDER_QUEUE = 'daily-reminders';
export const CHECK_JOB_NAME = 'check-daily-reminders';
export const CHECK_JOB_ID = 'check-daily-reminders-hourly';
// Every hour, on the hour — aligns with the 08:00/12:00/20:00 presets.
export const CHECK_JOB_CRON = '0 * * * *';
