import { describe, it, expect } from "vitest";
import { runOrgScanJson, runDrift } from "./helpers";

const ORG = "chrismlittle123-testing";
const CONFIG_REPO = "rd-config";

describe("JSON Output", () => {
  describe("JSON Flag", () => {
    it("should output valid JSON with --json flag", () => {
      const result = runDrift(
        `scan --org ${ORG} --config-repo ${CONFIG_REPO} --repo rd-ts-clean --json`
      );
      const output = result.stdout || result.stderr;

      expect(() => JSON.parse(output)).not.toThrow();
    });

    it("should include all required fields in JSON output", () => {
      const results = runOrgScanJson("rd-ts-clean");

      // Top-level fields
      expect(results.org).toBeDefined();
      expect(results.configRepo).toBeDefined();
      expect(results.timestamp).toBeDefined();
      expect(results.repos).toBeDefined();
      expect(results.summary).toBeDefined();
    });
  });

  describe("JSON Structure", () => {
    it("should have correct structure for repo results", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const repo = results.repos[0];

      expect(repo.repo).toBe("rd-ts-clean");
      expect(repo.results.path).toBeDefined();
      expect(repo.results.timestamp).toBeDefined();
      expect(Array.isArray(repo.results.integrity)).toBe(true);
      expect(Array.isArray(repo.results.discovered)).toBe(true);
      expect(Array.isArray(repo.results.scans)).toBe(true);
    });

    it("should have correct structure for scan results", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans[0];

      expect(scan.scan).toBeDefined();
      expect(scan.status).toBeDefined();
      expect(["pass", "fail", "skip", "error"]).toContain(scan.status);
      expect(scan.duration).toBeDefined();
      expect(typeof scan.duration).toBe("number");
    });

    it("should have correct structure for integrity results", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const integrity = results.repos[0].results.integrity[0];

      if (integrity) {
        expect(integrity.file).toBeDefined();
        expect(integrity.status).toBeDefined();
        expect(["match", "drift", "missing", "error"]).toContain(integrity.status);
        expect(integrity.severity).toBeDefined();
      }
    });

    it("should have correct structure for summary", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const summary = results.repos[0].results.summary;

      expect(typeof summary.integrityPassed).toBe("number");
      expect(typeof summary.integrityFailed).toBe("number");
      expect(typeof summary.integrityMissing).toBe("number");
      expect(typeof summary.discoveredFiles).toBe("number");
      expect(typeof summary.scansPassed).toBe("number");
      expect(typeof summary.scansFailed).toBe("number");
      expect(typeof summary.scansSkipped).toBe("number");
    });
  });

  describe("Org Summary Structure", () => {
    it("should have correct structure for org summary", () => {
      const results = runOrgScanJson();

      expect(typeof results.summary.reposScanned).toBe("number");
      expect(typeof results.summary.reposWithIssues).toBe("number");
      expect(typeof results.summary.reposSkipped).toBe("number");
      expect(typeof results.summary.totalIntegrityPassed).toBe("number");
      expect(typeof results.summary.totalIntegrityFailed).toBe("number");
      expect(typeof results.summary.totalIntegrityMissing).toBe("number");
      expect(typeof results.summary.totalScansPassed).toBe("number");
      expect(typeof results.summary.totalScansFailed).toBe("number");
    });
  });
});
