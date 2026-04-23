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

  const upstream = 'r-lib/actions/pr-fetch'
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

async function run() {
  try {
    await validateSubscription();
    const token: string = core.getInput("repo-token", { required: true });

    const client = github.getOctokit(token);

    const context = github.context;

    const issue: { owner: string; repo: string; number: number } =
      context.issue;

    console.log(`Collecting information about PR #${issue.number}...`);

    const { status, data: pr } = await client.rest.pulls.get({
      owner: issue.owner,
      repo: issue.repo,
      pull_number: issue.number,
    });

    const headBranch: string = pr.head.ref;
    const headCloneURL: string | undefined = pr.head.repo?.clone_url.replace(
      "https://",
      `https://x-access-token:${token}@`,
    );
    const headRepoOwnerLogin: string | undefined = pr.head.repo?.owner.login;

    if (headCloneURL !== undefined && headRepoOwnerLogin !== undefined) {
      await exec.exec("git", ["remote", "add", "pr", headCloneURL]);
      await exec.exec("git", ["fetch", "pr", headBranch]);
      await exec.exec("git", [
        "checkout",
        "-b",
        `${headRepoOwnerLogin}-${headBranch}`,
        `pr/${headBranch}`,
      ]);
    } else {
      throw new Error("Could not find repository, this should not happen");
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
