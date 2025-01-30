import { JWT_SECRET } from "../config/index";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";

class JwtService {
  static sign(
    payload: string | object | Buffer,
    expiry: string = "1y",
    secret: string = JWT_SECRET ?? "thisismysecert"
  ): string {
    const options: SignOptions = { expiresIn: expiry };
    return jwt.sign(payload, secret, options);
  }

  static verify<T extends JwtPayload | string>(
    token: string,
    secret: string = JWT_SECRET ?? "thisismysecert"
  ): T {
    return jwt.verify(token, secret) as T;
  }
}

export default JwtService;

// Function to extract JWT from request
export function getTokenFromRequest(request: any) {
  // Option 1: Extract from headers
  const authHeader = request.headers["sec-websocket-protocol"];
  if (authHeader) {
    return authHeader.split(",").pop().trim();
  }

  // Option 2: Extract from query parameters
  const url = require("url");
  const query = url.parse(request.url, true).query;
  return query.token;
}
