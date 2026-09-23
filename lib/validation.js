const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-()]{6,14}\d$/;
const CONTROL_CHAR_RE = /[\x00-\x1f\x7f]/;
const OTP_RE = /^\d{6}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidEmail(str) {
  return typeof str === "string" && str.length <= 254 && EMAIL_RE.test(str);
}

export function isValidPhone(str) {
  return typeof str === "string" && str.length >= 7 && str.length <= 15 && PHONE_RE.test(str);
}

export function isValidName(str) {
  return typeof str === "string" && str.trim().length >= 1 && str.length <= 100 && !CONTROL_CHAR_RE.test(str);
}

export function isValidPassword(str) {
  return typeof str === "string" && str.length >= 8 && str.length <= 128;
}

export function isValidOtp(str) {
  return typeof str === "string" && OTP_RE.test(str);
}

export function isValidSlug(str) {
  return typeof str === "string" && str.length >= 1 && str.length <= 200 && SLUG_RE.test(str);
}
