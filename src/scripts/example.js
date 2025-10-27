import { execSync } from "child_process";

const arg = process.argv[2];

if (!arg) {
    console.error("Usage: npm run start <example>");
    process.exit(1);
}

execSync(`node ./dist/examples/${arg}.js`, { stdio: "inherit" });
