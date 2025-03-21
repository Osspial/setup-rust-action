import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as toolCache from '@actions/tool-cache';
import * as path from 'path';
import * as os from 'os';
import {chmodSync} from 'fs';

let tempDirectory = process.env['RUNNER_TEMPDIRECTORY'] || '';

export async function install() {
  // `rustup` is already installed on Linux and Windows platforms
  if (os.platform() == 'darwin') {
    let toolPath = await installOnUnix();

    core.debug('rustup is located under: ' + toolPath);
    core.addPath(path.join(toolPath, 'bin'));
  } else {
    // Update the GitHub managed VM version of rustup
    // to leverage newer features like "latest latest compatible nightly"
    await exec.exec('rustup', ['self', 'update']);

    await exec.exec('rustup', ['set', 'profile', 'minimal']);
    // Github's default Windows install comes with rustup pre-installed with stable, including
    // rust-docs. This removes the default stable install so that it doesn't update rust-docs.
    await exec.exec('rustup', ['toolchain', 'uninstall', 'stable']);
  }
}

async function installOnUnix(): Promise<string> {
  let script = await toolCache.downloadTool("https://sh.rustup.rs");

  chmodSync(script, '777');
  await exec.exec(`"${script}"`, ['-y', '--default-toolchain', 'none', '--profile=minimal']);

  return path.join(process.env['HOME'] || '', '.cargo');
}
