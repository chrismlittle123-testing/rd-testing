import { describe, it, expect } from "vitest";
import { runOrgScanJson } from "./helpers";

describe("Scan Timeouts", () => {
  describe("Timeout Configuration", () => {
    it("should respect custom timeout on scans", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "quick-check"
      );
      expect(scan).toBeDefined();
      // Scan should complete within its 5s timeout
      expect(scan!.status).toBe("pass");
    });

    it("should complete npm-install-check within its timeout", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "npm-install-check"
      );
      expect(scan).toBeDefined();
      // npm-install-check has 180s timeout
      expect(scan!.status).toBe("pass");
      expect(scan!.duration).toBeLessThan(180000);
    });

    it("should complete typescript-compile within its timeout", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "typescript-compile"
      );
      expect(scan).toBeDefined();
      // typescript-compile has 120s timeout
      expect(["pass", "fail"]).toContain(scan!.status);
      expect(scan!.duration).toBeLessThan(120000);
    });

    it("should include duration in scan results", () => {
      const results = runOrgScanJson("rd-ts-clean");
      for (const scan of results.repos[0].results.scans) {
        expect(scan.duration).toBeDefined();
        expect(typeof scan.duration).toBe("number");
        expect(scan.duration).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Timeout Behavior", () => {
    it("should run quick-check scan with short timeout", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "quick-check"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("pass");
      // Should complete very quickly (well under 5s)
      expect(scan!.duration).toBeLessThan(5000);
    });
  });
});
