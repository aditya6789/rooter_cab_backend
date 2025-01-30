import twilio from "twilio";

const accountSid = "AC4016f27e164eb10e63c981b78a8c042a";
const authToken = "29080d66dca3d0fcdb6f3139e481ace3";
const client = twilio(accountSid, authToken);

export const sendOtpMessage = async (
  phone: string,
  otp: string
): Promise<void> => {
  await client.messages.create({
    body: `Your OTP code is ${otp}`,
    from: "your_twilio_phone_number",
    to: phone,
  });
};
