import jwt from "jsonwebtoken";

export function signToken(user) {
  return jwt.sign(
    { sub: String(user.id), username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d", issuer: "dragon-kingdom-api" }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token autentikasi diperlukan." });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "dragon-kingdom-api"
    });
    req.user = { id: Number(payload.sub), username: payload.username };
    next();
  } catch {
    return res.status(401).json({ error: "Token tidak valid atau kedaluwarsa." });
  }
}
