const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
function check(dir) {
  for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = path.join(dir, file.name);
    if (file.isDirectory()) check(name);
    else if (name.endsWith(".js"))
      execFileSync(process.execPath, ["--check", name], { stdio: "inherit" });
  }
}
check("src");
check("test");
