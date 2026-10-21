const { fork } = require("child_process");
const { randomUUID } = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const config = require("./config/env");
const Analysis = require("./models/Analysis");
const timeoutMs = 120000;
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
function execute(key) {
  return new Promise((resolve, reject) => {
    const child = fork(path.join(__dirname, "jobChild.js"), [], {
      execArgv: ["--max-old-space-size=256"],
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Job timed out"));
    }, timeoutMs);
    child.once("message", (message) => {
      clearTimeout(timer);
      child.kill();
      message.ok
        ? resolve(message.result)
        : reject(new Error("Analysis failed"));
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", () => {
      clearTimeout(timer);
      reject(new Error("Worker exited"));
    });
    child.send({ key });
  });
}
async function runOne() {
  const now = new Date();
  await Analysis.updateMany(
    { status: "processing", leaseUntil: { $lt: now }, attempts: { $gte: 3 } },
    {
      $set: {
        status: "failed",
        error: "Analysis could not finish. Please upload again.",
      },
    },
  );
  const token = randomUUID();
  const job = await Analysis.findOneAndUpdate(
    {
      attempts: { $lt: 3 },
      $or: [
        { status: "queued" },
        { status: "processing", leaseUntil: { $lt: now } },
      ],
    },
    {
      $set: {
        status: "processing",
        leaseToken: token,
        leaseUntil: new Date(Date.now() + timeoutMs + 30000),
      },
      $inc: { attempts: 1 },
    },
    { new: true, sort: { createdAt: 1 } },
  );
  if (!job) return false;
  try {
    const result = await execute(job.resumeS3Key);
    await Analysis.updateOne(
      { _id: job._id, leaseToken: token, status: "processing" },
      {
        $set: { ...result, status: "completed" },
        $unset: { error: 1, leaseToken: 1, leaseUntil: 1 },
      },
    );
  } catch (_) {
    await Analysis.updateOne(
      { _id: job._id, leaseToken: token },
      {
        $set: {
          status: job.attempts >= 3 ? "failed" : "queued",
          error:
            "Analysis could not finish. Retrying or upload again if failed.",
        },
        $unset: { leaseToken: 1, leaseUntil: 1 },
      },
    );
  }
  return true;
}
async function main() {
  await mongoose.connect(config.mongoUri);
  while (!stopping) {
    try {
      if (await runOne()) continue;
    } catch (error) {
      console.error("Worker database operation failed:", error.name);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  await mongoose.disconnect();
}
if (require.main === module)
  main().catch((error) => {
    console.error(error.name);
    process.exit(1);
  });
module.exports = { runOne, execute };
