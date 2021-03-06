/*-----------------------------------------------------------------------------
| Copyright (c) Jupyter Development Team.
| Distributed under the terms of the Modified BSD License.
|----------------------------------------------------------------------------*/

import * as path from 'path';
import * as utils from './utils';
import * as childProcess from 'child_process';

let allDeps: string[] = [];
let allDevDeps: string[] = [];

/**
 * Get the appropriate dependency for a given package name.
 *
 * @param name - The name of the package.
 *
 * @returns The dependency version specifier.
 */
export function getDependency(name: string): string {
  let version = '';
  let versions: { [key: string]: number } = {};
  allDeps = [];
  allDevDeps = [];

  utils.getLernaPaths().forEach(pkgRoot => {
    // Read in the package.json.
    let packagePath = path.join(pkgRoot, 'package.json');
    let data: any;
    try {
      data = utils.readJSONFile(packagePath);
    } catch (e) {
      return;
    }

    if (data.name === name) {
      version = '^' + data.version;
      return;
    }

    let deps = data.dependencies || {};
    let devDeps = data.devDependencies || {};
    if (deps[name]) {
      allDeps.push(data.name);
      if (deps[name] in versions) {
        versions[deps[name]]++;
      } else {
        versions[deps[name]] = 1;
      }
    }
    if (devDeps[name]) {
      allDevDeps.push(data.name);
      if (devDeps[name] in versions) {
        versions[devDeps[name]]++;
      } else {
        versions[devDeps[name]] = 1;
      }
    }
  });

  if (version) {
    return version;
  }

  if (Object.keys(versions).length > 0) {
    // Get the most common version.
    version = Object.keys(versions).reduce((a, b) => {
      return versions[a] > versions[b] ? a : b;
    });
  } else {
    let cmd = `npm view ${name} version`;
    version = '~' + String(childProcess.execSync(cmd)).trim();
  }

  return version;
}

if (require.main === module) {
  // Make sure we have required command line arguments.
  if (process.argv.length < 3) {
    let msg = '** Must supply a target library name\n';
    process.stderr.write(msg);
    process.exit(1);
  }
  let name = process.argv[2];
  let version = getDependency(name);
  console.log('dependency of: ', allDeps);
  console.log('devDependency of:', allDevDeps);
  console.log(`\n    "${name}": "${version}"`);
}
