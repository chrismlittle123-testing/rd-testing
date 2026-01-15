# repo-drift Testing Guide

This document describes how to test all features of the repo-drift CLI tool using the test infrastructure in the `chrismlittle123-testing` organization.

## Prerequisites

- Node.js >= 18
- GitHub CLI (`gh`) installed and authenticated
- `repo-drift` CLI installed globally: `npm install -g repo-drift`
- Access to the `chrismlittle123-testing` GitHub organization

## Test Infrastructure

### Test Repositories

| Repository | Purpose |
|------------|---------|
| `rd-config` | Central drift configuration with approved files |
| `rd-testing` | This test suite |
| `rd-ts-clean` | Clean TypeScript repo (passes all checks) |
| `rd-ts-drifted` | TypeScript repo with intentional drift |
| `rd-py-clean` | Clean Python repo (passes all checks) |
| `rd-py-failing` | Python repo that fails scans (no .gitignore, no tests) |
| `rd-production-tier` | Repo with `tier: production` metadata |
| `rd-excluded-repo` | Repo that should be excluded (matches `rd-excluded-*`) |
| `rd-action-test` | Repo with GitHub Action workflow |

### Configuration

The `rd-config` repository contains:
- `drift.config.yaml` - Central configuration
- `approved/` - Golden versions of protected files
  - `ci.yml` - Approved CI workflow
  - `release.yml` - Approved release workflow
  - `.prettierrc` - Approved Prettier config

## Running Automated Tests

```bash
# Install dependencies
cd rd-testing
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:scans      # Scan-related tests
npm run test:integrity  # Integrity check tests
npm run test:discovery  # File discovery tests
npm run test:org        # Organization scanning tests
npm run test:exclude    # Exclude pattern tests

# Watch mode during development
npm run test:watch
```

## Manual Testing Guide

The following features require manual testing or verification:

---

### 1. GitHub Action Integration

**Location:** `rd-action-test` repository

**Steps:**
1. Navigate to https://github.com/chrismlittle123-testing/rd-action-test
2. Go to Actions tab
3. Click "Run workflow" on the "Drift Check" workflow
4. Verify the workflow:
   - Runs successfully
   - Uses `chrismlittle123/repo-drift@v1` action
   - Scans the organization
   - Reports results

**Expected Results:**
- Action completes (may pass or fail based on drift state)
- Outputs show `has-drift`, `repos-scanned`, `repos-with-issues`

---

### 2. Slack Alerts (Requires Webhook)

**Note:** Requires a Slack webhook URL to test.

**Steps:**
1. Set up a Slack incoming webhook
2. Run org scan with Slack alert:
   ```bash
   drift scan --org chrismlittle123-testing \
     --config-repo rd-config \
     --slack-webhook $SLACK_WEBHOOK_URL
   ```
3. Verify Slack message is received

**Expected Results:**
- Rich Block Kit formatted message
- Shows repos with issues
- Includes severity levels
- Shows truncated diffs

---

### 3. Dashboard (Requires Local Setup)

**Note:** Dashboard testing requires running the Next.js app locally.

**Steps:**
1. Clone repo-drift: `gh repo clone chrismlittle123/repo-drift`
2. Navigate to dashboard: `cd dashboard`
3. Install dependencies: `npm install`
4. Run development server: `npm run dev`
5. Generate JSON results:
   ```bash
   drift scan --org chrismlittle123-testing \
     --config-repo rd-config --json > results.json
   ```
6. Load results in dashboard

**Expected Results:**
- Overview stats display correctly
- Repos with issues are highlighted
- Per-repo details are accessible
- Integrity results show diffs
- Scan results show duration and output

---

### 4. CLI Output Formatting

**Human-Readable Output:**
```bash
drift scan --org chrismlittle123-testing --config-repo rd-config
```

**Verify:**
- Color-coded output (✓ green, ✗ red, ○ yellow)
- Proper alignment and formatting
- Clear section headers
- Summary at the end

**JSON Output:**
```bash
drift scan --org chrismlittle123-testing --config-repo rd-config --json | jq .
```

**Verify:**
- Valid JSON structure
- All fields present
- Proper nesting

---

### 5. Fix Command (Interactive Testing)

**Dry Run:**
```bash
# Clone drifted repo
gh repo clone chrismlittle123-testing/rd-ts-drifted /tmp/test-fix
cd /tmp/test-fix

# Clone config
gh repo clone chrismlittle123-testing/rd-config /tmp/rd-config

# Preview fixes
drift fix --config /tmp/rd-config/drift.config.yaml --dry-run
```

**Actual Fix:**
```bash
# Apply fixes
drift fix --config /tmp/rd-config/drift.config.yaml

# Verify files were updated
git diff

# Fix specific file only
drift fix --config /tmp/rd-config/drift.config.yaml --file .prettierrc
```

**Expected Results:**
- Dry run shows what would change without modifying files
- Actual fix updates drifted files to match approved versions
- File-specific fix only updates the specified file

---

### 6. Error Handling

**Invalid Config:**
```bash
echo "invalid: yaml: [" > /tmp/bad-config.yaml
drift scan --config /tmp/bad-config.yaml
```

**Expected:** Error message about invalid YAML

**Missing Config Repo:**
```bash
drift scan --org chrismlittle123-testing --config-repo nonexistent-repo
```

**Expected:** Error message about missing config repo

**Invalid Org:**
```bash
drift scan --org nonexistent-org-12345
```

**Expected:** Error message about org/user not found

---

### 7. Timeout Handling

**Long-Running Scan:**
Create a scan with a very short timeout to test timeout behavior:

1. Temporarily modify `rd-config/drift.config.yaml`:
   ```yaml
   scans:
     - name: slow-scan
       command: sleep 10
       timeout: 1  # 1 second timeout
   ```

2. Run scan and verify timeout is enforced

**Expected:** Scan should fail with timeout error

---

### 8. Tier-Based Filtering Verification

**Verify Production Tier:**
```bash
# Scan production-tier repo
drift scan --org chrismlittle123-testing --config-repo rd-config --repo rd-production-tier --json | jq '.repos[0].results.scans[] | select(.scan == "security-audit" or .scan == "license-check")'
```

**Expected:** Both `security-audit` and `license-check` scans should run (not be skipped)

**Verify Non-Production:**
```bash
# Scan non-production repo
drift scan --org chrismlittle123-testing --config-repo rd-config --repo rd-ts-clean --json | jq '.repos[0].results.scans[] | select(.scan == "security-audit" or .scan == "license-check")'
```

**Expected:** Both scans should be skipped

---

### 9. Exclude Patterns Verification

**Full Org Scan:**
```bash
drift scan --org chrismlittle123-testing --config-repo rd-config --json | jq '.repos[].repo'
```

**Expected:**
- Should NOT include: `rd-excluded-repo`, `cmt-*` repos, `drift-config`
- Should include: `rd-ts-clean`, `rd-ts-drifted`, `rd-py-clean`, etc.

---

### 10. Concurrent/Parallel Scanning

**Large Org Simulation:**
Test with multiple repos to verify performance and stability:

```bash
time drift scan --org chrismlittle123-testing --config-repo rd-config
```

**Expected:** All repos scanned without memory issues or hangs

---

## Test Matrix

| Feature | Automated | Manual | Notes |
|---------|-----------|--------|-------|
| Basic Scans | ✅ | | `scans.test.ts` |
| Conditional Scans | ✅ | | `scans.test.ts` |
| Tier-Based Scans | ✅ | ✅ | Verify visually |
| Integrity Checks | ✅ | | `integrity.test.ts` |
| Drift Detection | ✅ | | `integrity.test.ts` |
| Missing Files | ✅ | | `integrity.test.ts` |
| File Discovery | ✅ | | `discovery.test.ts` |
| Org Scanning | ✅ | | `org-scanning.test.ts` |
| Single Repo Mode | ✅ | | `org-scanning.test.ts` |
| Exclude Patterns | ✅ | ✅ | Verify visually |
| JSON Output | ✅ | | `json-output.test.ts` |
| Local Scanning | ✅ | | `local-scan.test.ts` |
| Fix Command | ✅ | ✅ | `fix.test.ts` + manual |
| Fix Dry Run | ✅ | | `fix.test.ts` |
| GitHub Action | | ✅ | Manual trigger required |
| Slack Alerts | | ✅ | Requires webhook |
| Dashboard | | ✅ | Requires local setup |
| CLI Formatting | | ✅ | Visual inspection |
| Error Handling | | ✅ | Manual edge cases |
| Timeouts | | ✅ | Requires config change |

---

## Adding New Tests

### Adding Automated Tests

1. Create a new test file in `src/` (e.g., `src/new-feature.test.ts`)
2. Import helpers from `./helpers`
3. Use Vitest's `describe`, `it`, `expect` for assertions
4. Run `npm test` to verify

### Adding Test Fixtures

1. Create a new repo in `chrismlittle123-testing` with `rd-` prefix
2. Set up the repo with the required test data
3. Update `rd-config/drift.config.yaml` if new config is needed
4. Document the repo in this file

### Updating Exclude Patterns

If you need to exclude additional repos from testing:

1. Edit `rd-config/drift.config.yaml`
2. Add the pattern to the `exclude` list
3. Push changes to `rd-config`

---

## Troubleshooting

### Tests Failing with Auth Errors
- Ensure `gh auth status` shows you're logged in
- Verify you have access to `chrismlittle123-testing` org

### Tests Timing Out
- Increase timeout in `vitest.config.ts`
- Check network connectivity
- Verify repos exist and are accessible

### Unexpected Scan Results
- Pull latest changes from `rd-config`
- Verify test repos haven't been modified
- Check `drift --version` matches expected

### Config Changes Not Taking Effect
- Push changes to `rd-config` remote
- Wait a moment for GitHub to sync
- Re-run tests
