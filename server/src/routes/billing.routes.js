const express = require("express");
const {
  createCheckoutSession,
  createBillingPortalSession
} = require("../controllers/billingController");
const { requireAuth, requireVerifiedEmail } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth, requireVerifiedEmail);
router.post("/checkout-session", createCheckoutSession);
router.post("/portal-session", createBillingPortalSession);

module.exports = router;
