'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { isProtectedFile } = require('./policy-engine');

function validateFilesystemPath(root, relativePath) {
  const reasons = [];

  if (typeof root !== 'string' ||
      root.length === 0 ||
      !path.isAbsolute(root)) {
    return {
      allowed: false,
      reasons: ['invalid_root']
    };
  }

  if (typeof relativePath !== 'string') {
    return {
      allowed: false,
      reasons: ['path_not_allowlisted']
    };
  }

  let protectedPath = true;

  try {
    protectedPath = isProtectedFile(relativePath);
  } catch {
    return {
      allowed: false,
      reasons: ['invalid_or_unsafe_path']
    };
  }

  if (protectedPath) {
    return {
      allowed: false,
      reasons: ['path_not_allowlisted']
    };
  }

  const parts = relativePath.split('/');

  if (parts.some(part =>
      !part || part === '.' || part === '..')) {
    return {
      allowed: false,
      reasons: ['invalid_path_segments']
    };
  }

  try {
    const rootInfo = fs.lstatSync(root);

    if (!rootInfo.isDirectory() ||
        rootInfo.isSymbolicLink()) {
      reasons.push('invalid_root_type');
    }

    const resolvedRoot = fs.realpathSync(root);
    const target = path.resolve(root, relativePath);
    const containment = path.relative(resolvedRoot, target);

    if (containment === '..' ||
        containment.startsWith('..' + path.sep) ||
        path.isAbsolute(containment)) {
      reasons.push('path_outside_root');
    }

    let current = resolvedRoot;

    for (const part of parts) {
      current = path.join(current, part);

      const info = fs.lstatSync(current);

      if (info.isSymbolicLink()) {
        reasons.push('symlink_component');
        break;
      }
    }

    if (reasons.length === 0) {
      const info = fs.lstatSync(current);

      if (!info.isFile()) {
        reasons.push('not_regular_file');
      }
    }
  } catch {
    reasons.push('filesystem_resolution_failed');
  }

  return {
    allowed: reasons.length === 0,
    reasons
  };
}

module.exports = { validateFilesystemPath };
