import { execSync, ExecSyncOptions } from "child_process";
import { mkdtempSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const ORG = "chrismlittle123-testing";
const CONFIG_REPO = "rd-config";

export interface DriftResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface DriftJsonResult {
  path: string;
  timestamp: string;
  integrity: IntegrityResult[];
  discovered: DiscoveryResult[];
  scans: ScanResult[];
  summary: Summary;
}

export interface IntegrityResult {
  file: string;
  status: "match" | "drift" | "missing" | "error";
  severity: string;
  diff?: string;
}

export interface DiscoveryResult {
  file: string;
  pattern: string;
  suggestion: string;
  isProtected: boolean;
}

export interface ScanResult {
  scan: string;
  status: "pass" | "fail" | "skip" | "error";
  exitCode?: number;
  duration: number;
  skippedReason?: string;
}

export interface Summary {
  integrityPassed: number;
  integrityFailed: number;
  integrityMissing: number;
  discoveredFiles: number;
  scansPassed: number;
  scansFailed: number;
  scansSkipped: number;
}

export interface OrgScanResult {
  org: string;
  configRepo: string;
  timestamp: string;
  repos: RepoResult[];
  summary: OrgSummary;
}

export interface RepoResult {
  repo: string;
  results: DriftJsonResult;
  error?: string;
}

export interface OrgSummary {
  reposScanned: number;
  reposWithIssues: number;
  reposSkipped: number;
  totalIntegrityPassed: number;
  totalIntegrityFailed: number;
  totalIntegrityMissing: number;
  totalScansPassed: number;
  totalScansFailed: number;
}

/**
 * Run drift CLI command and return result
 */
export function runDrift(args: string, options?: ExecSyncOptions): DriftResult {
  const cmd = `drift ${args}`;
  let stdout = "";
  let stderr = "";
  let exitCode = 0;

  try {
    stdout = execSync(cmd, {
      encoding: "utf-8",
      timeout: 120000,
      ...options,
    });
  } catch (error: any) {
    exitCode = error.status || 1;
    stdout = error.stdout || "";
    stderr = error.stderr || "";
  }

  return { exitCode, stdout, stderr };
}

/**
 * Run drift scan with JSON output and parse result
 */
export function runDriftJson(args: string): DriftJsonResult {
  const result = runDrift(`${args} --json`);
  const output = result.stdout || result.stderr;
  return JSON.parse(output);
}

/**
 * Run drift org scan with JSON output
 */
export function runOrgScanJson(repo?: string): OrgScanResult {
  const repoArg = repo ? `--repo ${repo}` : "";
  const result = runDrift(
    `scan --org ${ORG} --config-repo ${CONFIG_REPO} ${repoArg} --json`
  );
  const output = result.stdout || result.stderr;
  return JSON.parse(output);
}

/**
 * Run drift org scan (human-readable output)
 */
export function runOrgScan(repo?: string): DriftResult {
  const repoArg = repo ? `--repo ${repo}` : "";
  return runDrift(`scan --org ${ORG} --config-repo ${CONFIG_REPO} ${repoArg}`);
}

/**
 * Clone a repo to a temp directory
 */
export function cloneRepo(repo: string): string {
  const tmpDir = mkdtempSync(join(tmpdir(), `drift-test-${repo}-`));
  execSync(`gh repo clone ${ORG}/${repo} ${tmpDir}`, {
    encoding: "utf-8",
    stdio: "pipe",
  });
  return tmpDir;
}

/**
 * Clean up a temp directory
 */
export function cleanupTempDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Run drift scan on a local path with rd-config
 */
export function runLocalScan(path: string): DriftJsonResult {
  const configDir = cloneRepo(CONFIG_REPO);
  try {
    const result = runDrift(
      `scan --path ${path} --config ${configDir}/drift.config.yaml --json`
    );
    const output = result.stdout || result.stderr;
    return JSON.parse(output);
  } finally {
    cleanupTempDir(configDir);
  }
}

/**
 * Get list of repos in org matching pattern
 */
export function listOrgRepos(pattern?: string): string[] {
  const result = execSync(
    `gh repo list ${ORG} --json name --jq '.[].name'`,
    { encoding: "utf-8" }
  );
  const repos = result.trim().split("\n").filter(Boolean);
  if (pattern) {
    const regex = new RegExp(pattern);
    return repos.filter((r) => regex.test(r));
  }
  return repos;
}
