#!/usr/bin/env bun

/**
 * Helper script for versioning and publishing the SDK
 * Usage:
 *   bun run scripts/publish.js [patch|minor|major]
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Get the version bump type from command line arguments
const args = process.argv.slice(2);
const versionBump = args[0] || "patch";

if (!["patch", "minor", "major"].includes(versionBump)) {
  console.error("Invalid version bump type. Use patch, minor, or major.");
  process.exit(1);
}

try {
  // Read the current package.json
  const packageJsonPath = join(import.meta.dir, "..", "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const currentVersion = packageJson.version;

  // Parse the version
  const [major, minor, patch] = currentVersion.split(".").map(Number);

  // Calculate the new version
  let newVersion;
  if (versionBump === "major") {
    newVersion = `${major + 1}.0.0`;
  } else if (versionBump === "minor") {
    newVersion = `${major}.${minor + 1}.0`;
  } else {
    newVersion = `${major}.${minor}.${patch + 1}`;
  }

  // Update the package.json
  packageJson.version = newVersion;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

  console.log(`Version updated from ${currentVersion} to ${newVersion}`);

  // Build the package
  console.log("Building the package...");
  execSync("bun run build", { stdio: "inherit" });

  // Create a git tag
  console.log("Creating git tag...");
  execSync(`git add package.json`, { stdio: "inherit" });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, {
    stdio: "inherit",
  });
  execSync(`git tag v${newVersion}`, { stdio: "inherit" });

  console.log(`
Successfully prepared version ${newVersion}!

To publish:
1. Push the changes and tag:
   git push origin main
   git push origin v${newVersion}

2. Or publish manually:
   bun publish --access public
`);
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
