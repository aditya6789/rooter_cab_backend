/**
 * Generates a 4-digit OTP
 * @returns A string containing a 4-digit random OTP
 */
export const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
}; 