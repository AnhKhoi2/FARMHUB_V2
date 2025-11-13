import { Router } from "express";
import * as collectionController from "../controllers/collectionController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import {
  createCollectionValidation,
  updateCollectionValidation,
  addNotebookValidation,
  addMultipleNotebooksValidation,
  removeNotebookValidation,
  searchCollectionValidation,
} from "../validations/collection.validation.js";

const router = Router();

// Tất cả routes collection đều cần xác thực
router.use(verifyToken);

// Tìm kiếm - ĐẶT TRƯỚC route /:id
router.get(
  "/search",
  validate(searchCollectionValidation, "query"),
  collectionController.searchCollections
);

// CRUD cơ bản
router.get("/", collectionController.getAllCollections);
router.get("/:id", collectionController.getCollectionById);
router.post(
  "/",
  validate(createCollectionValidation),
  collectionController.createCollection
);
router.put(
  "/:id",
  validate(updateCollectionValidation),
  collectionController.updateCollection
);
router.delete("/:id", collectionController.deleteCollection);

// Quản lý notebooks trong collection
router.get("/:id/notebooks", collectionController.getNotebooksInCollection);
router.post(
  "/:id/notebooks",
  validate(addNotebookValidation),
  collectionController.addNotebookToCollection
);
router.post(
  "/:id/notebooks/bulk",
  validate(addMultipleNotebooksValidation),
  collectionController.addMultipleNotebooks
);
router.delete(
  "/:id/notebooks",
  validate(removeNotebookValidation),
  collectionController.removeNotebookFromCollection
);

export default router;
