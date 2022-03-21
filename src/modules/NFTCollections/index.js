import express from "express";
import { validateSchema } from "../../middlewares";
import {
  getNftCollectionsController,
  getSingleNftCollectionController,
} from "./controller";
import { getNftCollectionsSchema, NftSymbolParamsSchema } from "./schema";

const router = express.Router();

router.get(
  "/",
  validateSchema(getNftCollectionsSchema, { includeQuery: true }),
  getNftCollectionsController
);

router.get(
  "/:symbol",
  validateSchema(NftSymbolParamsSchema, { includeQuery: true }),
  getSingleNftCollectionController
);

export { router as nftCollectionModule };
