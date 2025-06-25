import * as core from "@actions/core";
import * as github from "@actions/github";
import * as exec from "@actions/exec";
import axios, { isAxiosError } from "axios";

async function validateSubscription(): Promise<void> {
  const API_URL = `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/subscription`;

  try {
    await axios.get(API_URL, { timeout: 3000 });
  } catch (error) {
    if (isAxiosError(error) && error.response) {
      core.error(
        "Subscription is not valid. Reach out to support@stepsecurity.io",
      );
      process.exit(1);
    } else {
      core.info("Timeout or API not reachable. Continuing to next step.");
    }
  }
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

    await exec.exec("git", [
      "push",
      headCloneURL,
      cli_args,
      `HEAD:${headBranch}`,
    ]);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
