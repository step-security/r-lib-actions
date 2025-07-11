import * as core from "@actions/core";
import { getR } from "./installer";
import * as path from "path";
import * as fs from "fs";
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
