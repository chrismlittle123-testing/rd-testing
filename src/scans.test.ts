import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  runOrgScanJson,
  runOrgScan,
  cloneRepo,
  cleanupTempDir,
  runDrift,
} from "./helpers";

describe("Scans", () => {
  describe("Basic Scans", () => {
    it("should pass has-gitignore for repos with .gitignore", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "has-gitignore"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("pass");
    });

    it("should fail has-gitignore for repos without .gitignore", () => {
      const results = runOrgScanJson("rd-py-failing");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "has-gitignore"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("fail");
    });

    it("should pass has-readme for repos with README.md", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "has-readme"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("pass");
    });

    it("should pass has-tests for repos with tests directory", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "has-tests"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("pass");
    });

    it("should fail has-tests for repos without tests directory", () => {
      const results = runOrgScanJson("rd-py-failing");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "has-tests"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("fail");
    });
  });

  describe("Conditional Scans", () => {
    it("should run typescript-compile when tsconfig.json exists", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "typescript-compile"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).not.toBe("skip");
    });

    it("should skip typescript-compile when tsconfig.json does not exist", () => {
      const results = runOrgScanJson("rd-py-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "typescript-compile"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("skip");
      expect(scan!.skippedReason).toContain("tsconfig.json");
    });

    it("should run python-syntax-check when pyproject.toml exists", () => {
      const results = runOrgScanJson("rd-py-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "python-syntax-check"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).not.toBe("skip");
    });

    it("should skip python-syntax-check when pyproject.toml does not exist", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "python-syntax-check"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("skip");
    });

    it("should run npm-install-check when package-lock.json exists", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "npm-install-check"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).not.toBe("skip");
    });
  });

  describe("Tier-Based Scans", () => {
    it("should run security-audit for production tier repos", () => {
      const results = runOrgScanJson("rd-production-tier");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "security-audit"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).not.toBe("skip");
    });

    it("should run license-check for production tier repos", () => {
      const results = runOrgScanJson("rd-production-tier");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "license-check"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("pass");
    });

    it("should skip security-audit for non-production tier repos", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "security-audit"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("skip");
    });

    it("should skip license-check for non-production tier repos", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "license-check"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("skip");
    });
  });

  describe("Scan Exit Codes", () => {
    it("should exit 0 when all scans pass", () => {
      const result = runOrgScan("rd-ts-clean");
      expect(result.exitCode).toBe(0);
    });

    it("should exit 1 when scans fail", () => {
      const result = runOrgScan("rd-py-failing");
      expect(result.exitCode).toBe(1);
    });
  });
});
