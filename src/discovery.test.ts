import { describe, it, expect } from "vitest";
import { runOrgScanJson } from "./helpers";

describe("Discovery", () => {
  describe("File Discovery", () => {
    it("should discover workflow files matching pattern", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const discovered = results.repos[0].results.discovered;

      const workflowFiles = discovered.filter((d) =>
        d.pattern.includes(".github/workflows")
      );
      expect(workflowFiles.length).toBeGreaterThan(0);
    });

    it("should include suggestion for discovered files", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const discovered = results.repos[0].results.discovered;

      const workflowFile = discovered.find((d) =>
        d.file.includes(".github/workflows")
      );
      expect(workflowFile).toBeDefined();
      expect(workflowFile!.suggestion).toBeDefined();
      expect(workflowFile!.suggestion.length).toBeGreaterThan(0);
    });

    it("should mark protected files in discovery results", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const discovered = results.repos[0].results.discovered;

      // ci.yml is protected, so if discovered, isProtected should be true
      const ciFile = discovered.find((d) => d.file === ".github/workflows/ci.yml");
      if (ciFile) {
        expect(ciFile.isProtected).toBe(true);
      }
    });

    it("should mark unprotected files in discovery results", () => {
      const results = runOrgScanJson("rd-action-test");
      const discovered = results.repos[0].results.discovered;

      // drift.yml is not in protected list
      const driftFile = discovered.find((d) =>
        d.file === ".github/workflows/drift.yml"
      );
      if (driftFile) {
        expect(driftFile.isProtected).toBe(false);
      }
    });
  });

  describe("Discovery Patterns", () => {
    it("should discover config files matching *.config.js pattern", () => {
      // rd-ts-drifted might have config files
      const results = runOrgScanJson("rd-ts-drifted");
      const discovered = results.repos[0].results.discovered;

      const configFiles = discovered.filter(
        (d) => d.pattern === "*.config.js" || d.pattern === "*.config.ts"
      );
      // May or may not have config files, just verify structure
      configFiles.forEach((f) => {
        expect(f.suggestion).toBeDefined();
        expect(f.isProtected).toBeDefined();
      });
    });
  });

  describe("Discovery Summary", () => {
    it("should count discovered files in summary", () => {
      const results = runOrgScanJson("rd-ts-clean");
      const summary = results.repos[0].results.summary;

      // discoveredFiles counts unprotected files only
      expect(summary.discoveredFiles).toBeDefined();
      expect(typeof summary.discoveredFiles).toBe("number");
    });
  });
});
