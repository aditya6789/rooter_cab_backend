import Joi from "joi";

// Schema to validate the phone number
export const sendOtpSchema = Joi.object({
  phone: Joi.string().pattern(new RegExp("^[0-9]{10}$")).required(),
});

// Schema to validate OTP
export const validateOtpSchema = Joi.object({
  phone: Joi.string().pattern(new RegExp("^[0-9]{10}$")).required(),
  otp: Joi.string().pattern(new RegExp("^[0-9]{6}$")).required(),
});

// Schema to validate user registration
export const registerSchema = Joi.object({
  full_name: Joi.string().max(50).required(),
  phone: Joi.string(),
  email: Joi.string().email().required(),
});

export const driverRegisterSchema = Joi.object({
  full_name: Joi.string().max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string(),
  aadharcard: Joi.string().required(),
  pancard: Joi.string().required(),
  rc: Joi.string().required(),
  driverlicence: Joi.string().required(),
  profile_image: Joi.string().required(),
});
