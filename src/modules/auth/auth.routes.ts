import { Router } from "express";
import { authGuard } from "../../middlewares/authGuard";

export const authRoutes = Router();

authRoutes.get("/session", authGuard, (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.user?.userId,
      uid: req.user?.uid,
      name: req.user?.name,
      email: req.user?.email,
      role: req.user?.roles?.[0]
    }
  });
});
