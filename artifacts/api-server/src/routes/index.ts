import { Router, type IRouter } from "express";
import healthRouter from "./health";
import appsRouter from "./apps";
import categoriesRouter from "./categories";
import subscriptionsRouter from "./subscriptions";
import adminRouter from "./admin";
import ipaRouter from "./ipa";
import enrollRouter from "./enroll";
import testGroupsRouter from "./test-groups";

const router: IRouter = Router();

router.use(healthRouter);
router.use(appsRouter);
router.use(categoriesRouter);
router.use(subscriptionsRouter);
router.use(adminRouter);
router.use(ipaRouter);
router.use(enrollRouter);
router.use(testGroupsRouter);

export default router;
