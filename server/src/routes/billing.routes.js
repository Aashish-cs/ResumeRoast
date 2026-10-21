const express = require("express");
const {
  createCheckoutSession,
  createBillingPortalSession,
} = require("../controllers/billingController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, require("../middleware/accountLimit")("billing", 10));
router.post("/checkout-session", createCheckoutSession);
router.post("/portal-session", createBillingPortalSession);

module.exports = router;
