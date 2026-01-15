import { describe, it, expect } from "vitest";
import { runOrgScanJson, runOrgScan } from "./helpers";

describe("Repo Metadata", () => {
  describe("Tier Detection", () => {
    it("should detect production tier from repo-metadata.yaml", () => {
      // rd-production-tier has repo-metadata.yaml with tier: production
      const results = runOrgScanJson("rd-production-tier");
      // Production tier scans should run (not skip)
      const securityAudit = results.repos[0].results.scans.find(
        (s) => s.scan === "security-audit"
      );
      expect(securityAudit).toBeDefined();
      expect(securityAudit!.status).not.toBe("skip");
    });

    it("should run tier-specific scans for production repos", () => {
      const results = runOrgScanJson("rd-production-tier");
      const licenseCheck = results.repos[0].results.scans.find(
        (s) => s.scan === "license-check"
      );
      expect(licenseCheck).toBeDefined();
      // license-check has tiers: [production], should run for production tier
      expect(licenseCheck!.status).not.toBe("skip");
    });

    it("should skip tier-specific scans for repos without matching tier", () => {
      // rd-ts-clean has no repo-metadata.yaml (no tier)
      const results = runOrgScanJson("rd-ts-clean");
      const securityAudit = results.repos[0].results.scans.find(
        (s) => s.scan === "security-audit"
      );
      expect(securityAudit).toBeDefined();
      expect(securityAudit!.status).toBe("skip");
      expect(securityAudit!.skippedReason).toContain("tier");
    });

    it("should include tier info in skip reason", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const licenseCheck = results.repos[0].results.scans.find(
        (s) => s.scan === "license-check"
      );
      expect(licenseCheck).toBeDefined();
      expect(licenseCheck!.status).toBe("skip");
      expect(licenseCheck!.skippedReason).toContain("production");
    });
  });

  describe("Repos Without Metadata", () => {
    it("should handle repos without repo-metadata.yaml", () => {
      // rd-ts-clean has no repo-metadata.yaml
      const results = runOrgScanJson("rd-ts-clean");
      expect(results.repos[0]).toBeDefined();
      expect(results.repos[0].results.scans.length).toBeGreaterThan(0);
    });

    it("should run non-tier scans on repos without metadata", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const hasReadme = results.repos[0].results.scans.find(
        (s) => s.scan === "has-readme"
      );
      expect(hasReadme).toBeDefined();
      // has-readme has no tier requirement, should run
      expect(hasReadme!.status).not.toBe("skip");
    });
  });

  describe("Team Metadata", () => {
    it("should process repos with team metadata", () => {
      // rd-production-tier has team: platform in repo-metadata.yaml
      const results = runOrgScanJson("rd-production-tier");
      // Should still complete scan successfully
      expect(results.repos[0]).toBeDefined();
      expect(results.repos[0].error).toBeUndefined();
    });
  });
});
