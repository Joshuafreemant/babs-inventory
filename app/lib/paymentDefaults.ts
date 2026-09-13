/** Bank transfer details shown at checkout — edited by admins in Settings. */
export interface Payment {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export const DEFAULT_PAYMENT: Payment = {
  bankName: "",
  accountNumber: "",
  accountName: "",
};

export function cleanPayment(input: any): Payment {
  const s = (v: any, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  return {
    bankName: s(input?.bankName, 60),
    accountNumber: s(input?.accountNumber, 20),
    accountName: s(input?.accountName, 100),
  };
}
