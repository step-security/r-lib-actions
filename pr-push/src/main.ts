import * as core from "@actions/core";
import * as github from "@actions/github";
import * as exec from "@actions/exec";
import * as fs from "fs";
import axios, { isAxiosError } from "axios";

async function validateSubscription(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH
  let repoPrivate: boolean | undefined

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'))
    repoPrivate = eventData?.repository?.private
  }

  const upstream = 'r-lib/actions/pr-push'
  const action = process.env.GITHUB_ACTION_REPOSITORY
  const docsUrl =
    'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions'

  core.info('')
  core.info('[1;36mStepSecurity Maintained Action[0m')
  core.info(`Secure drop-in replacement for ${upstream}`)
  if (repoPrivate === false)
    core.info('[32m✓ Free for public repositories[0m')
  core.info(`[36mLearn more:[0m ${docsUrl}`)
  core.info('')

  if (repoPrivate === false) return

  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
  const body: Record<string, string> = {action: action || ''}
  if (serverUrl !== 'https://github.com') body.ghes_server = serverUrl
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      {timeout: 3000}
    )
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `[1;31mThis action requires a StepSecurity subscription for private repositories.[0m`
      )
      core.error(
        `[31mLearn how to enable a subscription: ${docsUrl}[0m`
      )
      process.exit(1)
    }
    core.info('Timeout or API not reachable. Continuing to next step.')
  }
}

function parseAndValidateGitPushArgs(cli_args: string): string[] {
  const allowedFlags = new Set([
    "--all",
    "--atomic",
    "--dry-run",
    "--follow-tags",
    "--force",
    "--force-with-lease",
    "--ipv4",
    "--ipv6",
    "--mirror",
    "--no-verify",
    "--porcelain",
    "--progress",
    "--prune",
    "--quiet",
    "--set-upstream",
    "--signed",
    "--signed=if-asked",
    "--signed=yes",
    "--signed=no",
    "--tags",
    "--thin",
    "--verbose",
    "-f",
    "-q",
    "-v",
    "-u",
  ]);

  const flagsWithValues = new Set([
    "--exec",
    "--receive-pack",
    "--repo",
    "--push-option",
    "-o",
  ]);

  const passthroughFlags = new Set([
    "--delete",
    "-d", // these expect a ref after
  ]);

  const result: string[] = [];
  const args = cli_args.trim().split(/\s+/);
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (allowedFlags.has(arg)) {
      result.push(arg);
    } else if (flagsWithValues.has(arg)) {
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        result.push(arg, next);
        i++;
      } else {
        core.warning(`Missing value for flag: ${arg}`);
      }
    } else if (arg.includes("=") && flagsWithValues.has(arg.split("=")[0])) {
      result.push(arg);
    } else if (passthroughFlags.has(arg)) {
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        result.push(arg, next);
        i++;
      } else {
        core.warning(`Missing target for ${arg}`);
      }
    } else {
      core.warning(`Ignoring unsupported or unsafe argument: ${arg}`);
    }

    i++;
  }
  return result;
}

async function run() {
  try {
    await validateSubscription();
    const token: string = core.getInput("repo-token", { required: true });
    const cli_args: string = core.getInput("args");

    const octokit = github.getOctokit(token);

    const context = github.context;

    const issue: { owner: string; repo: string; number: number } =
      context.issue;

    console.log(`Collecting information about PR #${issue.number}...`);

    const { status, data: pr } = await octokit.rest.pulls.get({
      owner: issue.owner,
      repo: issue.repo,
      pull_number: issue.number,
    });

    const headBranch = pr.head.ref;
    if (!pr.head.repo) {
      throw "Cannot find repo of the PR.";
    }
    const headCloneURL = pr.head.repo.clone_url.replace(
      "https://",
      `https://x-access-token:${token}@`,
    );

    const safeArgs = parseAndValidateGitPushArgs(cli_args);

    await exec.exec("git", [
      "push",
      headCloneURL,
      ...safeArgs,
      `HEAD:${headBranch}`,
    ]);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
