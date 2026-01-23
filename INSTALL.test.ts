/**
 * Meta tests for installation documentation.
 * Verify that INSTALL.md exists and contains all required sections.
 */

import { describe, test, expect } from "bun:test";
import { promises as fs } from "node:fs";
import { join } from "node:path";

const INSTALL_PATH = join(import.meta.dir, "INSTALL.md");

describe("INSTALL.md documentation", () => {
  let content: string;

  test("INSTALL.md file exists", async () => {
    const stat = await fs.stat(INSTALL_PATH);
    expect(stat.isFile()).toBeTrue();
  });

  test("INSTALL.md can be read", async () => {
    content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(100);
  });

  test("contains Prerequisites section", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("## Prerequisites");
  });

  test("mentions fzf as a prerequisite", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("fzf");
    expect(content).toContain("fuzzy");
  });

  test("mentions OpenAI API key as a prerequisite", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("OpenAI API key");
  });

  test("contains Installation Methods section", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("## Installation Methods");
  });

  test("documents download binary method", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("Download Binary");
  });

  test("documents install via Bun method", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("Install via Bun");
    expect(content).toContain("bun install -g harvey");
  });

  test("documents build from source method", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("Build from Source");
    expect(content).toContain("git clone");
  });

  test("contains Post-Install Setup section", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("## Post-Install Setup");
  });

  test("explains how to add OpenAI API key", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("OPENAI_API_KEY");
  });

  test("contains platform-specific notes", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("## Platform-Specific Notes");
  });

  test("includes Linux instructions", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("Linux");
    expect(content).toContain("x64");
  });

  test("includes macOS instructions", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("macOS");
    expect(content).toContain("Intel");
  });

  test("includes Apple Silicon instructions", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("Apple Silicon");
    expect(content).toContain("arm64");
  });

  test("includes Windows instructions", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("Windows");
  });

  test("documents checksum verification", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("checksum");
    expect(content).toContain("shasum");
  });

  test("contains troubleshooting section", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("## Troubleshooting");
  });

  test("includes getting started information", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("## Getting Started");
    expect(content).toContain("harvey");
  });

  test("documents basic keybinds", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("Keybinds");
    expect(content).toContain("`n`"); // New chat
    expect(content).toContain("`/`"); // Search
    expect(content).toContain("`q`"); // Quit
  });

  test("mentions fzf installation instructions", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("brew install fzf");
    expect(content).toContain("apt install fzf");
  });

  test("includes GitHub releases link", async () => {
    if (!content) content = await fs.readFile(INSTALL_PATH, "utf-8");
    expect(content).toContain("github.com/h14h/harvey/releases");
  });

  test("README.md references INSTALL.md", async () => {
    const readmePath = join(import.meta.dir, "README.md");
    const readme = await fs.readFile(readmePath, "utf-8");
    expect(readme).toContain("INSTALL.md");
    expect(readme).toContain("Installation Guide");
  });
});
