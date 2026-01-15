import { describe, it, expect } from "vitest";
import { runOrgScanJson, runOrgScan } from "./helpers";

describe("Integrity Checks", () => {
  describe("File Matching", () => {
    it("should report match when file matches approved version", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const integrity = results.repos[0].results.integrity.find(
        (i) => i.file === ".github/workflows/ci.yml"
      );
      expect(integrity).toBeDefined();
      expect(integrity!.status).toBe("match");
    });

    it("should report match for .prettierrc when it matches approved", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const integrity = results.repos[0].results.integrity.find(
        (i) => i.file === ".prettierrc"
      );
      expect(integrity).toBeDefined();
      expect(integrity!.status).toBe("match");
    });
  });

  describe("Drift Detection", () => {
    it("should detect drift when file differs from approved version", () => {
      const results = runOrgScanJson("rd-ts-drifted");
      const integrity = results.repos[0].results.integrity.find(
        (i) => i.file === ".github/workflows/ci.yml"
      );
      expect(integrity).toBeDefined();
      expect(integrity!.status).toBe("drift");
      expect(integrity!.severity).toBe("high");
    });

    it("should detect drift in .prettierrc when it differs", () => {
      const results = runOrgScanJson("rd-ts-drifted");
      const integrity = results.repos[0].results.integrity.find(
        (i) => i.file === ".prettierrc"
      );
      expect(integrity).toBeDefined();
      expect(integrity!.status).toBe("drift");
      expect(integrity!.severity).toBe("low");
    });

    it("should include diff when drift is detected", () => {
      const results = runOrgScanJson("rd-ts-drifted");
      const integrity = results.repos[0].results.integrity.find(
        (i) => i.file === ".github/workflows/ci.yml"
      );
      expect(integrity).toBeDefined();
      expect(integrity!.diff).toBeDefined();
      expect(integrity!.diff!.length).toBeGreaterThan(0);
    });
  });

  describe("Missing Files", () => {
    it("should report missing when protected file does not exist", () => {
      const results = runOrgScanJson("rd-py-clean");
      const integrity = results.repos[0].results.integrity.find(
        (i) => i.file === ".github/workflows/ci.yml"
      );
      expect(integrity).toBeDefined();
      expect(integrity!.status).toBe("missing");
    });

    it("should report missing for release.yml when it does not exist", () => {
      const results = runOrgScanJson("rd-py-clean");
      const integrity = results.repos[0].results.integrity.find(
        (i) => i.file === ".github/workflows/release.yml"
      );
      expect(integrity).toBeDefined();
      expect(integrity!.status).toBe("missing");
      expect(integrity!.severity).toBe("critical");
    });
  });

  describe("Severity Levels", () => {
    it("should assign correct severity to integrity checks", () => {
      const results = runOrgScanJson("rd-ts-drifted");

      const ciWorkflow = results.repos[0].results.integrity.find(
        (i) => i.file === ".github/workflows/ci.yml"
      );
      expect(ciWorkflow!.severity).toBe("high");

      const prettierrc = results.repos[0].results.integrity.find(
        (i) => i.file === ".prettierrc"
      );
      expect(prettierrc!.severity).toBe("low");
    });
  });

  describe("Summary Counts", () => {
    it("should count integrity passed correctly", () => {
      const results = runOrgScanJson("rd-ts-clean");
      expect(results.repos[0].results.summary.integrityPassed).toBeGreaterThan(0);
    });

    it("should count integrity failed (drifted) correctly", () => {
      const results = runOrgScanJson("rd-ts-drifted");
      expect(results.repos[0].results.summary.integrityFailed).toBeGreaterThan(0);
    });

    it("should count integrity missing correctly", () => {
      const results = runOrgScanJson("rd-py-clean");
      // rd-py-clean is missing ci.yml and release.yml
      expect(results.repos[0].results.summary.integrityMissing).toBeGreaterThan(0);
    });
  });

  describe("Exit Codes", () => {
    it("should exit 1 when drift is detected", () => {
      const result = runOrgScan("rd-ts-drifted");
      expect(result.exitCode).toBe(1);
    });
  });
});
