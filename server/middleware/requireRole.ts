import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../../shared/types.js";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}
