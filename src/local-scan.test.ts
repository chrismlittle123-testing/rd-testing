import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { cloneRepo, cleanupTempDir, runLocalScan, runDrift } from "./helpers";

describe("Local Scanning", () => {
  let tempDir: string;

  describe("Path-Based Scanning", () => {
    beforeAll(() => {
      tempDir = cloneRepo("rd-ts-clean");
    });

    afterAll(() => {
      cleanupTempDir(tempDir);
    });

    it("should scan a local directory with --path flag", () => {
      const results = runLocalScan(tempDir);
      expect(results.path).toBe(tempDir);
    });

    it("should return scan results for local directory", () => {
      const results = runLocalScan(tempDir);
      expect(results.scans.length).toBeGreaterThan(0);
    });

    it("should return integrity results for local directory", () => {
      const results = runLocalScan(tempDir);
      expect(Array.isArray(results.integrity)).toBe(true);
    });

    it("should return discovery results for local directory", () => {
      const results = runLocalScan(tempDir);
      expect(Array.isArray(results.discovered)).toBe(true);
    });
  });

  describe("Config Path", () => {
    let configDir: string;
    let repoDir: string;

    beforeAll(() => {
      configDir = cloneRepo("rd-config");
      repoDir = cloneRepo("rd-ts-clean");
    });

    afterAll(() => {
      cleanupTempDir(configDir);
      cleanupTempDir(repoDir);
    });

    it("should use config from --config flag", () => {
      const result = runDrift(
        `scan --path ${repoDir} --config ${configDir}/drift.config.yaml --json`
      );
      const output = result.stdout || result.stderr;
      const results = JSON.parse(output);

      // Should have scans defined in rd-config
      expect(results.scans.length).toBeGreaterThan(0);
    });
  });

  describe("No Config", () => {
    let emptyDir: string;

    beforeAll(() => {
      // Create a temp dir without config
      emptyDir = cloneRepo("rd-excluded-repo");
    });

    afterAll(() => {
      cleanupTempDir(emptyDir);
    });

    it("should show message when no drift.config.yaml found", () => {
      const result = runDrift(`scan --path ${emptyDir}`);
      const output = result.stdout + result.stderr;

      expect(output).toContain("No drift.config.yaml found");
    });
  });
});
