import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "child_process";

interface ActionYaml {
  name: string;
  description: string;
  author: string;
  branding: {
    icon: string;
    color: string;
  };
  inputs: Record<
    string,
    {
      description: string;
      required: boolean;
      default?: string;
    }
  >;
  outputs: Record<
    string,
    {
      description: string;
      value: string;
    }
  >;
  runs: {
    using: string;
    steps: Array<{
      name?: string;
      uses?: string;
      shell?: string;
      run?: string;
    }>;
  };
}

describe("GitHub Action", () => {
  let actionYaml: ActionYaml;

  beforeAll(() => {
    // Fetch and parse action.yml from the repo-drift repository
    const content = execSync(
      "gh api repos/chrismlittle123/repo-drift/contents/action.yml | jq -r '.content' | base64 -d",
      { encoding: "utf-8" }
    );
    // Parse YAML (simple parsing for this structure)
    actionYaml = parseSimpleYaml(content);
  });

  describe("Action Metadata", () => {
    it("should have a name", () => {
      expect(actionYaml.name).toBeDefined();
      expect(actionYaml.name.length).toBeGreaterThan(0);
    });

    it("should have a description", () => {
      expect(actionYaml.description).toBeDefined();
      expect(actionYaml.description.length).toBeGreaterThan(0);
    });

    it("should have an author", () => {
      expect(actionYaml.author).toBeDefined();
    });

    it("should have branding configured", () => {
      expect(actionYaml.branding).toBeDefined();
      expect(actionYaml.branding.icon).toBeDefined();
      expect(actionYaml.branding.color).toBeDefined();
    });
  });

  describe("Required Inputs", () => {
    it("should require org input", () => {
      expect(actionYaml.inputs.org).toBeDefined();
      expect(actionYaml.inputs.org.required).toBe(true);
    });

    it("should require github-token input", () => {
      expect(actionYaml.inputs["github-token"]).toBeDefined();
      expect(actionYaml.inputs["github-token"].required).toBe(true);
    });
  });

  describe("Optional Inputs", () => {
    it("should have optional repo input", () => {
      expect(actionYaml.inputs.repo).toBeDefined();
      expect(actionYaml.inputs.repo.required).toBe(false);
    });

    it("should have optional config-repo input with default", () => {
      expect(actionYaml.inputs["config-repo"]).toBeDefined();
      expect(actionYaml.inputs["config-repo"].required).toBe(false);
      expect(actionYaml.inputs["config-repo"].default).toBe("drift-config");
    });

    // Note: slack-webhook input was removed in v0.2.0
    // Slack alerts are now handled via CLI only, not the GitHub Action

    it("should have optional json input with default false", () => {
      expect(actionYaml.inputs.json).toBeDefined();
      expect(actionYaml.inputs.json.required).toBe(false);
      expect(actionYaml.inputs.json.default).toBe("false");
    });

    it("should have optional fail-on-drift input with default true", () => {
      expect(actionYaml.inputs["fail-on-drift"]).toBeDefined();
      expect(actionYaml.inputs["fail-on-drift"].required).toBe(false);
      expect(actionYaml.inputs["fail-on-drift"].default).toBe("true");
    });
  });

  describe("Outputs", () => {
    it("should have has-drift output", () => {
      expect(actionYaml.outputs["has-drift"]).toBeDefined();
      expect(actionYaml.outputs["has-drift"].description).toBeDefined();
    });

    it("should have repos-scanned output", () => {
      expect(actionYaml.outputs["repos-scanned"]).toBeDefined();
    });

    it("should have repos-with-issues output", () => {
      expect(actionYaml.outputs["repos-with-issues"]).toBeDefined();
    });

    it("should have results output", () => {
      expect(actionYaml.outputs.results).toBeDefined();
    });
  });

  describe("Action Configuration", () => {
    it("should use composite runs", () => {
      expect(actionYaml.runs.using).toBe("composite");
    });

    it("should have steps defined", () => {
      expect(actionYaml.runs.steps).toBeDefined();
      expect(actionYaml.runs.steps.length).toBeGreaterThan(0);
    });

    it("should setup Node.js", () => {
      const nodeStep = actionYaml.runs.steps.find(
        (s) => s.uses && s.uses.includes("actions/setup-node")
      );
      expect(nodeStep).toBeDefined();
    });

    it("should install drift CLI", () => {
      const installStep = actionYaml.runs.steps.find(
        (s) => s.run && s.run.includes("npm install")
      );
      expect(installStep).toBeDefined();
    });
  });
});

/**
 * Simple YAML parser for action.yml structure
 */
function parseSimpleYaml(content: string): ActionYaml {
  const lines = content.split("\n");
  const result: any = {
    inputs: {},
    outputs: {},
    branding: {},
    runs: { steps: [] },
  };

  let currentSection = "";
  let currentItem = "";
  let inSteps = false;
  let currentStep: any = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Top-level keys
    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      if (trimmed.startsWith("name:")) {
        result.name = trimmed.replace("name:", "").trim().replace(/"/g, "");
      } else if (trimmed.startsWith("description:")) {
        result.description = trimmed
          .replace("description:", "")
          .trim()
          .replace(/"/g, "");
      } else if (trimmed.startsWith("author:")) {
        result.author = trimmed.replace("author:", "").trim().replace(/"/g, "");
      } else if (trimmed === "inputs:") {
        currentSection = "inputs";
      } else if (trimmed === "outputs:") {
        currentSection = "outputs";
      } else if (trimmed === "branding:") {
        currentSection = "branding";
      } else if (trimmed === "runs:") {
        currentSection = "runs";
      }
      continue;
    }

    // Section content
    if (currentSection === "branding") {
      if (trimmed.startsWith("icon:")) {
        result.branding.icon = trimmed
          .replace("icon:", "")
          .trim()
          .replace(/"/g, "");
      } else if (trimmed.startsWith("color:")) {
        result.branding.color = trimmed
          .replace("color:", "")
          .trim()
          .replace(/"/g, "");
      }
    } else if (currentSection === "inputs") {
      if (line.match(/^  \w/) && trimmed.endsWith(":")) {
        currentItem = trimmed.replace(":", "");
        result.inputs[currentItem] = { required: false };
      } else if (currentItem && trimmed.startsWith("description:")) {
        result.inputs[currentItem].description = trimmed
          .replace("description:", "")
          .trim()
          .replace(/"/g, "");
      } else if (currentItem && trimmed.startsWith("required:")) {
        result.inputs[currentItem].required =
          trimmed.replace("required:", "").trim() === "true";
      } else if (currentItem && trimmed.startsWith("default:")) {
        result.inputs[currentItem].default = trimmed
          .replace("default:", "")
          .trim()
          .replace(/"/g, "");
      }
    } else if (currentSection === "outputs") {
      if (line.match(/^  \w/) && trimmed.endsWith(":")) {
        currentItem = trimmed.replace(":", "");
        result.outputs[currentItem] = {};
      } else if (currentItem && trimmed.startsWith("description:")) {
        result.outputs[currentItem].description = trimmed
          .replace("description:", "")
          .trim()
          .replace(/"/g, "");
      } else if (currentItem && trimmed.startsWith("value:")) {
        result.outputs[currentItem].value = trimmed
          .replace("value:", "")
          .trim();
      }
    } else if (currentSection === "runs") {
      if (trimmed.startsWith("using:")) {
        result.runs.using = trimmed
          .replace("using:", "")
          .trim()
          .replace(/"/g, "");
      } else if (trimmed === "steps:") {
        inSteps = true;
      } else if (inSteps && trimmed.startsWith("- name:")) {
        if (currentStep) {
          result.runs.steps.push(currentStep);
        }
        currentStep = {
          name: trimmed.replace("- name:", "").trim().replace(/"/g, ""),
        };
      } else if (inSteps && trimmed.startsWith("- uses:")) {
        if (currentStep) {
          result.runs.steps.push(currentStep);
        }
        currentStep = {
          uses: trimmed.replace("- uses:", "").trim(),
        };
      } else if (inSteps && currentStep) {
        if (trimmed.startsWith("uses:")) {
          currentStep.uses = trimmed.replace("uses:", "").trim();
        } else if (trimmed.startsWith("shell:")) {
          currentStep.shell = trimmed.replace("shell:", "").trim();
        } else if (trimmed.startsWith("run:")) {
          currentStep.run = trimmed.replace("run:", "").trim();
        }
      }
    }
  }

  if (currentStep) {
    result.runs.steps.push(currentStep);
  }

  return result;
}
