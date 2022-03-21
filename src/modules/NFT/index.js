import express from "express";
import { validateSchema } from "../../middlewares";
import {
  getNftsController,
  getNftController,
  nftAnalysisController,
  getNftAnalysisController,
  getNftFromMagicEdenController,
} from "./controller";
import { getNftsSchema, nftAnalysisSchema } from "./schema";

const router = express.Router();

router.get(
  "/",
  validateSchema(getNftsSchema, { includeQuery: true }),
  getNftsController
);

router.get("/analysis", getNftAnalysisController);

router.get(
  "/:mint/magiceden",
  validateSchema(null, { idParamCheck: true, idName: "mint" }),
  getNftFromMagicEdenController
);

router.get(
  "/:mint",
  validateSchema(null, { idParamCheck: true, idName: "mint" }),
  getNftController
);

router.post(
  "/analysis",
  validateSchema(nftAnalysisSchema),
  nftAnalysisController
);

export { router as nftModule };
