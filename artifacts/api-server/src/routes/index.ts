import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import papersRouter from "./papers";
import verifierRouter from "./verifier";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(papersRouter);
router.use(verifierRouter);
router.use(adminRouter);

export default router;
