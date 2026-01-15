import { describe, it, expect } from "vitest";
import { runOrgScanJson } from "./helpers";

describe("Multi-Condition Scans", () => {
  describe("Array Conditions", () => {
    it("should run scan when ALL files in array exist", () => {
      // rd-ts-clean has both package.json and tsconfig.json
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "full-node-setup"
      );
      expect(scan).toBeDefined();
      // Should run because both files exist
      expect(scan!.status).not.toBe("skip");
      expect(scan!.status).toBe("pass");
    });

    it("should skip scan when ANY file in array is missing", () => {
      // rd-py-clean has neither package.json nor tsconfig.json
      const results = runOrgScanJson("rd-py-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "full-node-setup"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("skip");
    });

    it("should include skip reason for multi-condition scans", () => {
      const results = runOrgScanJson("rd-py-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "full-node-setup"
      );
      expect(scan).toBeDefined();
      expect(scan!.skippedReason).toBeDefined();
      // Should mention at least one of the missing files
      expect(
        scan!.skippedReason!.includes("package.json") ||
          scan!.skippedReason!.includes("tsconfig.json")
      ).toBe(true);
    });
  });

  describe("Single vs Array Conditions", () => {
    it("should handle single file condition", () => {
      // typescript-compile has if: tsconfig.json (single file)
      const results = runOrgScanJson("rd-ts-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "typescript-compile"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).not.toBe("skip");
    });

    it("should skip single condition when file missing", () => {
      // rd-py-clean doesn't have tsconfig.json
      const results = runOrgScanJson("rd-py-clean");
      const scan = results.repos[0].results.scans.find(
        (s) => s.scan === "typescript-compile"
      );
      expect(scan).toBeDefined();
      expect(scan!.status).toBe("skip");
      expect(scan!.skippedReason).toContain("tsconfig.json");
    });
  });
});
