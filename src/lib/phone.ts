/**
 * Formats a phone number for the WhatsApp API (wa.me) URL.
 * Converts local numbers (e.g., 0712345678 or 712345678) to international format (254712345678).
 * Keeps already formatted international numbers.
 */
export function cleanWhatsAppNumber(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  // Remove leading double zeros
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }
  
  // If it starts with "0", e.g., 0712345678, replace with 254712345678
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.substring(1);
  }
  
  // If the number is exactly 9 digits (local Kenyan number without leading 0, e.g. 712345678)
  // Prepend 254 (Kenya's country code)
  if (cleaned.length === 9) {
    cleaned = "254" + cleaned;
  }
  
  return cleaned;
}
