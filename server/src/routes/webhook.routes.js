const express = require("express");
const { handleStripeWebhook } = require("../controllers/billingController");

const router = express.Router();

router.post("/", handleStripeWebhook);

module.exports = router;
