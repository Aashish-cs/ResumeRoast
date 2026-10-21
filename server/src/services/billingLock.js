const { randomUUID } = require("crypto");
const User = require("../models/User");
const AppError = require("../utils/AppError");
module.exports = async function withBillingLock(userId, work) {
  const token = randomUUID();
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { billingLockUntil: { $lt: new Date() } },
        { billingLockUntil: { $exists: false } },
      ],
    },
    {
      $set: {
        billingLock: token,
        billingLockUntil: new Date(Date.now() + 60000),
      },
    },
    { new: true },
  );
  if (!user)
    throw new AppError("Billing is busy. Please retry.", 503, "BILLING_BUSY");
  const fence = {
    _id: userId,
    billingLock: token,
    billingLockUntil: { $gt: new Date() },
  };
  const save = async (update, options = {}) => {
    fence.billingLockUntil.$gt = new Date();
    const result = await User.updateOne(fence, update, options);
    if (!result.matchedCount)
      throw new AppError(
        "Billing operation expired. Retry.",
        503,
        "BILLING_LEASE_EXPIRED",
      );
  };
  try {
    return await work(user, save);
  } finally {
    await User.updateOne(
      { _id: userId, billingLock: token },
      { $unset: { billingLock: 1, billingLockUntil: 1 } },
    );
  }
};
