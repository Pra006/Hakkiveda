// TEMPORARY diagnostic endpoint. Remove before going live.
// Hit: GET /api/_diag?key=<DIAG_KEY value from env>
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");
  if (!process.env.DIAG_KEY || key !== process.env.DIAG_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    BREVO_API_KEY: !!process.env.BREVO_API_KEY,
    BREVO_SMTP_LOGIN: !!process.env.BREVO_SMTP_LOGIN,
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL || null,
    BREVO_SENDER_NAME: !!process.env.BREVO_SENDER_NAME,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL || null,
    NODE_ENV: process.env.NODE_ENV || null,
  };

  let db = { ok: false, error: null };
  try {
    await prisma.$queryRaw`SELECT 1`;
    db.ok = true;
  } catch (e) {
    db.error = String(e?.message || e).slice(0, 500);
  }

  let smtp = { ok: false, error: null };
  try {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@hakkiveda.com";
    const smtpLogin = process.env.BREVO_SMTP_LOGIN || senderEmail;
    if (!apiKey) throw new Error("BREVO_API_KEY missing");
    const t = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: { user: smtpLogin, pass: apiKey },
    });
    await t.verify();
    smtp.ok = true;
  } catch (e) {
    smtp.error = String(e?.message || e).slice(0, 500);
  }

  return NextResponse.json({ env, db, smtp });
}
