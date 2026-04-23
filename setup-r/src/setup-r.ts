import * as core from "@actions/core";
import { getR } from "./installer";
import * as path from "path";
import * as fs from "fs";
import axios, { isAxiosError } from "axios";

async function validateSubscription(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH
  let repoPrivate: boolean | undefined

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, 'utf8'))
    repoPrivate = eventData?.repository?.private
  }

  const upstream = 'r-lib/actions/setup-r'
  const action = process.env.GITHUB_ACTION_REPOSITORY
  const docsUrl =
    'https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions'

  core.info('')
  core.info('[1;36mStepSecurity Maintained Action[0m')
  core.info(`Secure drop-in replacement for ${upstream}`)
  if (repoPrivate === false)
    core.info('[32m✓ Free for public repositories[0m')
  core.info(`[36mLearn more:[0m ${docsUrl}`)
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
        `[1;31mThis action requires a StepSecurity subscription for private repositories.[0m`
      )
      core.error(
        `[31mLearn how to enable a subscription: ${docsUrl}[0m`
      )
      process.exit(1)
    }
    core.info('Timeout or API not reachable. Continuing to next step.')
  }
}

async function run() {
  try {
    await validateSubscription();
    core.debug(`started action`);

    var version: string;
    version = core.getInput("r-version");
    const workingDirectory: string = core.getInput("working-directory");

    if (version === "renv") {
      let renv_lock_path = path.join(workingDirectory, "renv.lock");
      if (fs.existsSync(renv_lock_path)) {
        let renv_lock = fs.readFileSync(renv_lock_path).toString();
        version = JSON.parse(renv_lock).R.Version;
        core.debug(
          `got version ${version} from renv.lock in ${workingDirectory}`,
        );
      } else {
        core.setFailed(`renv.lock does not exist in ${workingDirectory}.`);
      }
    } else {
      version = version;
      core.debug(`got version ${version} from input`);
    }

    await getR(version);

    const matchersPath = path.join(__dirname, "..", ".github");
    console.log(`##[add-matcher]${path.join(matchersPath, "rcmdcheck.json")}`);
    console.log(`##[add-matcher]${path.join(matchersPath, "testthat.json")}`);
    console.log(`##[add-matcher]${path.join(matchersPath, "r.json")}`);
  } catch (error) {
    core.setFailed(`${error}`);
  }
}

run();
