// src/lib/mpesaDaraja.ts
import { API_BASE_URL } from '@/config/api';

// Since we moved logic to backend, this file now just calls the backend API
export const mpesaConfig = {}; // No longer needed here

export async function stkPush(
  config: any,
  phone: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/mpesa/stkpush`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      amount,
      orderId: accountReference
    })
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error);
  }
  return data;
}
