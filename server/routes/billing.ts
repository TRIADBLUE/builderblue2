import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// All billing routes require authentication
router.use(authenticate);

// Billing routes will be implemented here

export default router;
