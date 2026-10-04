#!/usr/bin/env node
'use strict';

const crypto =
  require('crypto');

const fs =
  require('fs');

const os =
  require('os');

const path =
  require('path');

const {
  spawnSync
} =
  require('child_process');

const SCRIPT_ID =
  '159EMqc5tB9oQJGhci97j6b41BUvhG5wxUErTZgBFqSCghRcw4msFaKi7';

const PRODUCTION_DEPLOYMENT_ID =
  'AKfycbxTPu2haRrW9Ls0mkRV4uambT5ajC5RlNC5m7IBxPlcmspVjF5DGdNxOG4pCzjQbHeX';

const PUBLIC_RPC =
  'reosPhiladelphiaProbateCertifiedOversizeOrphanAnchoredDurableEvidenceCaptureProductionTransport';

const MANAGEMENT_PROFILE =
  'default';

const RUNTIME_PROFILE =
  'reos-runtime';

const MINIMUM_SUCCESSOR_VERSION =
  145;

const ATTEMPT_COUNT =
  1;

const ATTEMPT_DIRECTORY =
  'attempt-1';

const TEST_MODE =
  process.env.REOS_PB1_TEST_MODE ===
    '1';

function fail(
  message,
  exitCode = 1
) {
  process.stderr.write(
    'STOP=' +
      message +
      '\n'
  );

  process.exit(
    exitCode
  );
}

function parseArguments() {
  const argv =
    process.argv.slice(2);

  let executeProduction =
    false;

  let expectedVersion =
    null;

  for (
    let i = 0;
    i < argv.length;
    i += 1
  ) {
    const value =
      argv[i];

    if (
      value ===
      '--execute-production'
    ) {
      if (executeProduction) {
        fail(
          'Duplicate --execute-production.'
        );
      }

      executeProduction =
        true;

      continue;
    }

    if (
      value ===
      '--expected-version'
    ) {
      if (
        expectedVersion !==
        null
      ) {
        fail(
          'Duplicate --expected-version.'
        );
      }

      if (
        i + 1 >=
        argv.length
      ) {
        fail(
          'Missing --expected-version value.'
        );
      }

      expectedVersion =
        Number(
          argv[
            i + 1
          ]
        );

      i += 1;

      continue;
    }

    fail(
      'Unknown argument: ' +
        value
    );
  }

  if (!executeProduction) {
    fail(
      'Explicit --execute-production gate required.'
    );
  }

  if (
    !Number.isInteger(
      expectedVersion
    )
  ) {
    fail(
      'Expected version must be an integer.'
    );
  }

  if (
    expectedVersion <
    MINIMUM_SUCCESSOR_VERSION
  ) {
    fail(
      'Expected version must be >= ' +
        MINIMUM_SUCCESSOR_VERSION +
        '.'
    );
  }

  return {
    expectedVersion
  };
}

function ensureNoUnauthorizedTestOverrides() {
  if (TEST_MODE) {
    return;
  }

  for (
    const key
    of [
      'REOS_PB1_TEST_CLASP_BIN',
      'REOS_PB1_TEST_EVIDENCE_ROOT'
    ]
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        process.env,
        key
      )
    ) {
      fail(
        'Test-only environment override present in production mode: ' +
          key
      );
    }
  }
}

function resolveClaspBinary() {
  if (TEST_MODE) {
    const value =
      process.env[
        'REOS_PB1_TEST_CLASP_BIN'
      ];

    if (!value) {
      fail(
        'Test clasp binary required.'
      );
    }

    return path.resolve(
      value
    );
  }

  return 'clasp';
}

function resolveEvidenceRoot() {
  if (TEST_MODE) {
    const value =
      process.env[
        'REOS_PB1_TEST_EVIDENCE_ROOT'
      ];

    if (!value) {
      fail(
        'Test evidence root required.'
      );
    }

    return path.resolve(
      value
    );
  }

  const home =
    process.env.HOME ||
    os.homedir();

  if (!home) {
    fail(
      'HOME unavailable.'
    );
  }

  const result =
    path.resolve(
      home,
      '.reos',
      'evidence',
      'probate',
      'pb1'
    );

  const tmp =
    path.resolve(
      '/tmp'
    );

  const varTmp =
    path.resolve(
      '/var/tmp'
    );

  if (
    result === tmp ||
    result.startsWith(
      tmp +
        path.sep
    ) ||
    result === varTmp ||
    result.startsWith(
      varTmp +
        path.sep
    )
  ) {
    fail(
      'Temporary system storage is prohibited.'
    );
  }

  return result;
}

function certifyLocalProjectIdentity() {
  const projectFile =
    path.resolve(
      process.cwd(),
      '.clasp.json'
    );

  let project;

  try {
    project =
      JSON.parse(
        fs.readFileSync(
          projectFile,
          'utf8'
        )
      );
  } catch (error) {
    fail(
      'Unable to read local .clasp.json project identity.'
    );
  }

  if (
    !project ||
    project.scriptId !==
      SCRIPT_ID
  ) {
    fail(
      'Local .clasp.json scriptId does not match certified script.'
    );
  }

  return projectFile;
}

function fsyncDirectory(
  directory
) {
  const fd =
    fs.openSync(
      directory,
      'r'
    );

  try {
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

function sha256Buffer(
  buffer
) {
  return crypto
    .createHash(
      'sha256'
    )
    .update(buffer)
    .digest('hex');
}

function fileIdentity(
  filename
) {
  const buffer =
    fs.readFileSync(
      filename
    );

  return {
    bytes:
      buffer.length,

    sha256:
      sha256Buffer(
        buffer
      )
  };
}

function writeExclusiveFile(
  filename,
  buffer,
  mode = 0o600
) {
  const fd =
    fs.openSync(
      filename,
      'wx',
      mode
    );

  try {
    fs.writeFileSync(
      fd,
      buffer
    );

    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

function promoteWithoutOverwrite(
  temporary,
  final
) {
  /*
   * Both paths are in the same attempt directory.
   *
   * linkSync publishes the final name atomically and fails with
   * EEXIST instead of overwriting an existing evidence file.
   * The temporary name is then removed.
   */
  fs.linkSync(
    temporary,
    final
  );

  fs.unlinkSync(
    temporary
  );
}

function writeDurableJson(
  directory,
  finalName,
  object
) {
  const temporary =
    path.join(
      directory,
      '.' +
        finalName +
        '.tmp'
    );

  const final =
    path.join(
      directory,
      finalName
    );

  const buffer =
    Buffer.from(
      JSON.stringify(
        object,
        null,
        2
      ) +
        '\n',
      'utf8'
    );

  writeExclusiveFile(
    temporary,
    buffer
  );

  promoteWithoutOverwrite(
    temporary,
    final
  );

  fsyncDirectory(
    directory
  );

  return final;
}

function runReadOnlyClasp(
  claspBinary,
  args
) {
  const result =
    spawnSync(
      claspBinary,
      args,
      {
        encoding:
          'utf8',

        env:
          process.env,

        stdio: [
          'ignore',
          'pipe',
          'pipe'
        ]
      }
    );

  if (result.error) {
    fail(
      'Read-only clasp command failed to start: ' +
        result.error.name
    );
  }

  if (
    result.status !==
    0
  ) {
    fail(
      'Read-only clasp command failed with exit ' +
        String(
          result.status
        ) +
        '.'
    );
  }

  return {
    stdout:
      String(
        result.stdout ||
        ''
      ),

    stderr:
      String(
        result.stderr ||
        ''
      )
  };
}

function stripAnsi(
  value
) {
  return value.replace(
    /\x1b\[[0-9;]*[A-Za-z]/g,
    ''
  );
}

function parseVersions(
  raw
) {
  const numbers =
    [];

  for (
    const rawLine
    of stripAnsi(
      raw
    ).split(
      /\r?\n/
    )
  ) {
    const match =
      rawLine.match(
        /^\s*(\d+)\s*(?:-|–|—)\s*/
      );

    if (match) {
      numbers.push(
        Number(
          match[1]
        )
      );
    }
  }

  if (
    numbers.length ===
    0
  ) {
    fail(
      'No Apps Script versions parsed.'
    );
  }

  return numbers;
}

function parseProductionDeployment(
  raw
) {
  const matches =
    [];

  for (
    const rawLine
    of stripAnsi(
      raw
    ).split(
      /\r?\n/
    )
  ) {
    const match =
      rawLine.match(
        /^\s*-\s*(\S+)\s+@(\S+)/
      );

    if (
      match &&
      match[1] ===
        PRODUCTION_DEPLOYMENT_ID
    ) {
      matches.push(
        match[2]
      );
    }
  }

  if (
    matches.length !==
    1
  ) {
    fail(
      'Production deployment ID must appear exactly once.'
    );
  }

  return matches[0];
}

function certifyDeploymentState(
  claspBinary,
  expectedVersion
) {
  const versionResult =
    runReadOnlyClasp(
      claspBinary,
      [
        '--user',
        MANAGEMENT_PROFILE,
        'versions'
      ]
    );

  const versions =
    parseVersions(
      versionResult.stdout +
        '\n' +
        versionResult.stderr
    );

  const highestVersion =
    Math.max(
      ...versions
    );

  if (
    highestVersion !==
    expectedVersion
  ) {
    fail(
      'Highest Apps Script version does not equal expected version.'
    );
  }

  if (
    !versions.includes(
      expectedVersion
    )
  ) {
    fail(
      'Expected Apps Script version absent.'
    );
  }

  const deploymentResult =
    runReadOnlyClasp(
      claspBinary,
      [
        '--user',
        MANAGEMENT_PROFILE,
        'deployments'
      ]
    );

  const deploymentVersion =
    parseProductionDeployment(
      deploymentResult.stdout +
        '\n' +
        deploymentResult.stderr
    );

  if (
    deploymentVersion !==
    String(
      expectedVersion
    )
  ) {
    fail(
      'Production deployment does not point to expected version.'
    );
  }

  return {
    highestVersion,
    deploymentVersion
  };
}

function ensureRoot(
  evidenceRoot
) {
  fs.mkdirSync(
    evidenceRoot,
    {
      recursive:
        true,

      mode:
        0o700
    }
  );

  fs.chmodSync(
    evidenceRoot,
    0o700
  );

  fsyncDirectory(
    evidenceRoot
  );
}

function claimAttempt(
  evidenceRoot,
  expectedVersion
) {
  const attemptDirectory =
    path.join(
      evidenceRoot,
      ATTEMPT_DIRECTORY
    );

  try {
    fs.mkdirSync(
      attemptDirectory,
      {
        mode:
          0o700
      }
    );
  } catch (error) {
    if (
      error &&
      error.code ===
        'EEXIST'
    ) {
      fail(
        'Durable attempt-1 already claimed.'
      );
    }

    throw error;
  }

  fs.chmodSync(
    attemptDirectory,
    0o700
  );

  fsyncDirectory(
    evidenceRoot
  );

  const claim = {
    schemaVersion:
      1,

    rpc:
      PUBLIC_RPC,

    scriptId:
      SCRIPT_ID,

    managementProfile:
      MANAGEMENT_PROFILE,

    runtimeProfile:
      RUNTIME_PROFILE,

    productionDeploymentId:
      PRODUCTION_DEPLOYMENT_ID,

    deploymentVersion:
      expectedVersion,

    attemptCount:
      ATTEMPT_COUNT,

    createdAtUtc:
      new Date().toISOString(),

    status:
      'CLAIMED_BEFORE_PRODUCTION_RPC'
  };

  const claimBuffer =
    Buffer.from(
      JSON.stringify(
        claim,
        null,
        2
      ) +
        '\n',
      'utf8'
    );

  writeExclusiveFile(
    path.join(
      attemptDirectory,
      'claim.json'
    ),
    claimBuffer
  );

  fsyncDirectory(
    attemptDirectory
  );

  return attemptDirectory;
}

function executeAndCapture(
  claspBinary,
  attemptDirectory,
  expectedVersion
) {
  const stdoutTemporary =
    path.join(
      attemptDirectory,
      '.stdout.raw.tmp'
    );

  const stderrTemporary =
    path.join(
      attemptDirectory,
      '.stderr.raw.tmp'
    );

  const stdoutFinal =
    path.join(
      attemptDirectory,
      'stdout.raw'
    );

  const stderrFinal =
    path.join(
      attemptDirectory,
      'stderr.raw'
    );

  const stdoutFd =
    fs.openSync(
      stdoutTemporary,
      'wx',
      0o600
    );

  let stderrFd;

  try {
    stderrFd =
      fs.openSync(
        stderrTemporary,
        'wx',
        0o600
      );
  } catch (error) {
    fs.closeSync(
      stdoutFd
    );

    throw error;
  }

  let child;

  try {
    child =
      spawnSync(
        claspBinary,
        [
          '--user',
          RUNTIME_PROFILE,
          '--json',
          'run-function',
          PUBLIC_RPC,
          '--nondev',
          '--params',
          '[]'
        ],
        {
          env:
            process.env,

          stdio: [
            'ignore',
            stdoutFd,
            stderrFd
          ]
        }
      );

    /*
     * Raw transport output has reached the same-filesystem temporary
     * files. Durability is established before any result interpretation.
     */
    fs.fsyncSync(
      stdoutFd
    );

    fs.fsyncSync(
      stderrFd
    );
  } finally {
    fs.closeSync(
      stdoutFd
    );

    fs.closeSync(
      stderrFd
    );
  }

  promoteWithoutOverwrite(
    stdoutTemporary,
    stdoutFinal
  );

  promoteWithoutOverwrite(
    stderrTemporary,
    stderrFinal
  );

  fsyncDirectory(
    attemptDirectory
  );

  const stdoutIdentity =
    fileIdentity(
      stdoutFinal
    );

  const stderrIdentity =
    fileIdentity(
      stderrFinal
    );

  const processExitCode =
    child &&
    Number.isInteger(
      child.status
    )
      ? child.status
      : -1;

  const manifest = {
    schemaVersion:
      1,

    rpc:
      PUBLIC_RPC,

    scriptId:
      SCRIPT_ID,

    managementProfile:
      MANAGEMENT_PROFILE,

    runtimeProfile:
      RUNTIME_PROFILE,

    productionDeploymentId:
      PRODUCTION_DEPLOYMENT_ID,

    deploymentVersion:
      expectedVersion,

    attemptCount:
      ATTEMPT_COUNT,

    capturedAtUtc:
      new Date().toISOString(),

    processExitCode,

    processSignal:
      child &&
      child.signal
        ? String(
            child.signal
          )
        : null,

    processSpawnError:
      child &&
      child.error
        ? String(
            child.error.name ||
            'Error'
          )
        : null,

    stdoutBytes:
      stdoutIdentity.bytes,

    stdoutSha256:
      stdoutIdentity.sha256,

    stderrBytes:
      stderrIdentity.bytes,

    stderrSha256:
      stderrIdentity.sha256,

    jsonMode:
      true,

    nondev:
      true,

    parameterCount:
      0,

    captureBeforeInterpretation:
      true,

    captureBeforeJsonNormalization:
      true,

    captureBeforeContextAnalysis:
      true,

    rawPayloadInterpreted:
      false,

    automaticRetryImplemented:
      false
  };

  const manifestFinal =
    writeDurableJson(
      attemptDirectory,
      'manifest.json',
      manifest
    );

  /*
   * Directory metadata containing stdout.raw, stderr.raw and manifest.json
   * is now durably synchronized. Only now may process/capture status be
   * interpreted.
   */
  fsyncDirectory(
    attemptDirectory
  );

  if (
    stdoutIdentity.bytes ===
    0
  ) {
    fail(
      'Captured stdout is empty.'
    );
  }

  if (
    child &&
    child.error
  ) {
    fail(
      'Production child process failed to start: ' +
        String(
          child.error.name ||
          'Error'
        )
    );
  }

  if (
    processExitCode !==
    0
  ) {
    fail(
      'Production child process exited nonzero: ' +
        String(
          processExitCode
        ),
      processExitCode > 0
        ? processExitCode
        : 1
    );
  }

  return {
    stdoutFinal,
    stderrFinal,
    manifestFinal,
    stdoutIdentity,
    stderrIdentity,
    processExitCode
  };
}

function main() {
  ensureNoUnauthorizedTestOverrides();

  const {
    expectedVersion
  } =
    parseArguments();

  const claspBinary =
    resolveClaspBinary();

  /*
   * clasp run-function targets the project configured by the local
   * .clasp.json. Certify that identity before creating an attempt
   * claim or executing any production child process.
   */
  certifyLocalProjectIdentity();

  const evidenceRoot =
    resolveEvidenceRoot();

  ensureRoot(
    evidenceRoot
  );

  const deploymentState =
    certifyDeploymentState(
      claspBinary,
      expectedVersion
    );

  const attemptDirectory =
    claimAttempt(
      evidenceRoot,
      expectedVersion
    );

  const capture =
    executeAndCapture(
      claspBinary,
      attemptDirectory,
      expectedVersion
    );

  process.stdout.write(
    'PB1_DURABLE_EVIDENCE_CAPTURE_HARNESS_COMPLETED=true\n'
  );

  process.stdout.write(
    'PRODUCTION_RPC_EXECUTED=true\n'
  );

  process.stdout.write(
    'PRODUCTION_RPC_ATTEMPT_COUNT=1\n'
  );

  process.stdout.write(
    'AUTOMATIC_RETRY_IMPLEMENTED=false\n'
  );

  process.stdout.write(
    'DEPLOYMENT_VERSION=' +
      deploymentState.deploymentVersion +
      '\n'
  );

  process.stdout.write(
    'STDOUT_BYTES=' +
      String(
        capture.stdoutIdentity.bytes
      ) +
      '\n'
  );

  process.stdout.write(
    'STDOUT_SHA256=' +
      capture.stdoutIdentity.sha256 +
      '\n'
  );

  process.stdout.write(
    'STDERR_BYTES=' +
      String(
        capture.stderrIdentity.bytes
      ) +
      '\n'
  );

  process.stdout.write(
    'STDERR_SHA256=' +
      capture.stderrIdentity.sha256 +
      '\n'
  );

  process.stdout.write(
    'RPC_PAYLOAD_INTERPRETED=false\n'
  );

  process.stdout.write(
    'NEXT_GATE=PB1_DURABLE_CAPTURE_OFFLINE_EVIDENCE_ANALYSIS\n'
  );
}

main();
