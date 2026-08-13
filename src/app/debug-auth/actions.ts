"use server";

import { auth } from "@/auth";

export async function debugAuthAction() {
  const session = await auth();
  const hasSecret = !!process.env.AUTH_SECRET;
  const secretLen = process.env.AUTH_SECRET?.length ?? 0;
  return {
    session: JSON.stringify(session),
    hasSecret,
    secretLen,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
  };
}
