import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cloneRepo, cleanupTempDir, runDrift } from "./helpers";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

describe("Fix Command", () => {
  let repoDir: string;
  let configDir: string;

  beforeEach(() => {
    // Clone a fresh copy of the drifted repo for each test
    repoDir = cloneRepo("rd-ts-drifted");
    configDir = cloneRepo("rd-config");
  });

  afterEach(() => {
    cleanupTempDir(repoDir);
    cleanupTempDir(configDir);
  });

  describe("Dry Run", () => {
    it("should show what would be fixed with --dry-run", () => {
      const result = runDrift(
        `fix --path ${repoDir} --config ${configDir}/drift.config.yaml --dry-run`
      );
      const output = result.stdout + result.stderr;

      // Should mention files that would be fixed
      expect(output.toLowerCase()).toContain("would");
    });

    it("should not modify files with --dry-run", () => {
      // Read original content
      const ciPath = join(repoDir, ".github/workflows/ci.yml");
      const originalContent = readFileSync(ciPath, "utf-8");

      // Run dry-run fix
      runDrift(
        `fix --path ${repoDir} --config ${configDir}/drift.config.yaml --dry-run`
      );

      // Content should be unchanged
      const newContent = readFileSync(ciPath, "utf-8");
      expect(newContent).toBe(originalContent);
    });
  });

  describe("Actual Fix", () => {
    it("should fix drifted files", () => {
      // Run fix
      runDrift(`fix --path ${repoDir} --config ${configDir}/drift.config.yaml`);

      // Read the fixed file
      const ciPath = join(repoDir, ".github/workflows/ci.yml");
      const fixedContent = readFileSync(ciPath, "utf-8");

      // Read the approved file
      const approvedPath = join(configDir, "approved/ci.yml");
      const approvedContent = readFileSync(approvedPath, "utf-8");

      expect(fixedContent).toBe(approvedContent);
    });

    it("should fix specific file with --file flag", () => {
      // Run fix for specific file
      runDrift(
        `fix --path ${repoDir} --config ${configDir}/drift.config.yaml --file .prettierrc`
      );

      // Read the fixed file
      const prettierPath = join(repoDir, ".prettierrc");
      const fixedContent = readFileSync(prettierPath, "utf-8");

      // Read the approved file
      const approvedPath = join(configDir, "approved/.prettierrc");
      const approvedContent = readFileSync(approvedPath, "utf-8");

      expect(fixedContent).toBe(approvedContent);
    });
  });

  describe("Fix Missing Files", () => {
    it("should create missing protected files", () => {
      // rd-ts-drifted doesn't have release.yml
      const releasePath = join(repoDir, ".github/workflows/release.yml");
      expect(existsSync(releasePath)).toBe(false);

      // Run fix
      runDrift(`fix --path ${repoDir} --config ${configDir}/drift.config.yaml`);

      // File should now exist
      expect(existsSync(releasePath)).toBe(true);

      // Content should match approved
      const fixedContent = readFileSync(releasePath, "utf-8");
      const approvedContent = readFileSync(
        join(configDir, "approved/release.yml"),
        "utf-8"
      );
      expect(fixedContent).toBe(approvedContent);
    });
  });

  describe("Exit Codes", () => {
    it("should exit 0 on successful fix", () => {
      const result = runDrift(
        `fix --path ${repoDir} --config ${configDir}/drift.config.yaml`
      );
      expect(result.exitCode).toBe(0);
    });
  });
});
