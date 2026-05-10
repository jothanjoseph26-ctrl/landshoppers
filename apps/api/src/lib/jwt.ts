import * as jose from "jose";

import { ApiError } from "./errors.js";

const ACCESS_ALG = "HS256";

function getSecret(): Uint8Array {
  const raw = process.env["JWT_SECRET"];
  if (!raw || raw.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 chars) for @landshoppers/api");
  }
  return new TextEncoder().encode(raw);
}

export type AccessClaims = {
  sub: string;
  role: string;
  email: string;
};

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  const secret = getSecret();
  return new jose.SignJWT({
    role: claims.role,
    email: claims.email,
    token_type: "access",
  })
    .setProtectedHeader({ alg: ACCESS_ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(process.env["JWT_ACCESS_EXPIRES"] ?? "15m")
    .sign(secret);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  const secret = getSecret();
  try {
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [ACCESS_ALG],
    });
    const sub = payload.sub;
    const role = payload.role;
    const email = payload.email;
    const tokenType = payload.token_type;
    if (
      typeof sub !== "string" ||
      typeof role !== "string" ||
      typeof email !== "string" ||
      tokenType !== "access"
    ) {
      throw new ApiError(401, "INVALID_TOKEN", "Access token payload is invalid");
    }
    return { sub, role, email };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(401, "INVALID_TOKEN", "Access token could not be verified");
  }
}
