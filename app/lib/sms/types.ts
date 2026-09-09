export type SmsSendResult = {
  ok: boolean;
  skipped?: boolean;
  sent?: number;
  failed?: number;
  error?: string;
};

export interface SmsProvider {
  /** stable key used in SMS_PROVIDER and logs */
  key: string;
  /** human label for the console */
  label: string;
  /** true when the env vars this provider needs are present */
  configured(): boolean;
  /** sender ID / shortcode shown in the console status line */
  senderId(): string;
  /** send one message to a list of normalised numbers (country code, no "+") */
  send(numbers: string[], message: string): Promise<SmsSendResult>;
}
