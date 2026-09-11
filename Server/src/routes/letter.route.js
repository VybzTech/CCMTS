import express from "express";
import {
  generate_single_letter,
  generate_bulk_letter,
  approve_letter,
  reject_letter,
  trigger_auto_allocation,
  allocate_letter,
  mark_in_transit,
  mark_delivered,
  mark_undelivered,
  get_letter,
  get_letters,
  update_letter_status_generic,
} from "../controllers/letter.controller.js";
import { protect, restrictTo } from "../middleware/protect.js";
import { uploadPod } from "../middleware/upload.js";

const router = express.Router();

// Get all letters - for admin or particular courier
router.get("/", protect, get_letters);

// Get single letter by ID
router.get("/:letter_id", protect, get_letter);

// Create letters
router.post("/single", protect, restrictTo("Admin", "ODU", "Management"), generate_single_letter);
router.post("/bulk", protect, restrictTo("Admin", "ODU", "Management"), generate_bulk_letter);

// Approval workflow - Admin only
router.patch("/:letter_id/approve", protect, restrictTo("Admin"), approve_letter);
router.patch("/:letter_id/reject", protect, restrictTo("Admin"), reject_letter);

// Allocation - Admin only
router.post("/auto-allocate", protect, restrictTo("Admin"), trigger_auto_allocation);
router.post("/:letter_id/allocate/:courier_id", protect, restrictTo("Admin"), allocate_letter);

// Delivery status updates - Courier and Admin
router.patch("/:letter_id/in-transit", protect, restrictTo("Courier", "Admin"), mark_in_transit);
router.patch(
  "/:letter_id/delivered",
  protect,
  restrictTo("Courier", "Admin"),
  uploadPod.single("pod_image"),
  mark_delivered
);
router.patch("/:letter_id/undelivered", protect, restrictTo("Courier", "Admin"), mark_undelivered);
router.patch("/:letter_id", protect, restrictTo("Courier", "Admin"), update_letter_status_generic);

export default router;
