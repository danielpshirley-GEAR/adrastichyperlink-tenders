import { execSync } from 'child_process';

function resolveCommitSha() {
  if (process.env.COMMIT_REF && process.env.COMMIT_REF.trim()) {
    return process.env.COMMIT_REF.trim();
  }
  if (process.env.NEXT_PUBLIC_COMMIT_SHA && process.env.NEXT_PUBLIC_COMMIT_SHA.trim()) {
    return process.env.NEXT_PUBLIC_COMMIT_SHA.trim();
  }
  if (process.env.BUILD_COMMIT_SHA && process.env.BUILD_COMMIT_SHA.trim()) {
    return process.env.BUILD_COMMIT_SHA.trim();
  }
  if (process.env.VERCEL_GIT_COMMIT_SHA && process.env.VERCEL_GIT_COMMIT_SHA.trim()) {
    return process.env.VERCEL_GIT_COMMIT_SHA.trim();
  }
  try {
    const gitSha = execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (gitSha) return gitSha;
  } catch {
    // git not available
  }
  return '';
}

function resolveBranch() {
  if (process.env.BRANCH && process.env.BRANCH.trim()) {
    return process.env.BRANCH.trim();
  }
  if (process.env.VERCEL_GIT_COMMIT_REF && process.env.VERCEL_GIT_COMMIT_REF.trim()) {
    return process.env.VERCEL_GIT_COMMIT_REF.trim();
  }
  try {
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (gitBranch && gitBranch !== 'HEAD') return gitBranch;
  } catch {
    // git not available
  }
  return '';
}

const buildCommitSha = resolveCommitSha();
const buildBranch = resolveBranch();
const isNetlifyBuild = Boolean(process.env.NETLIFY || process.env.NETLIFY_LOCAL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    COMMIT_REF: buildCommitSha,
    NEXT_PUBLIC_COMMIT_SHA: buildCommitSha,
    BUILD_COMMIT_SHA: buildCommitSha,
    DEPLOY_ID: process.env.DEPLOY_ID || '',
    CONTEXT: process.env.CONTEXT || '',
    DEPLOY_CONTEXT: process.env.CONTEXT || '',
    BRANCH: buildBranch,
    DEPLOY_BRANCH: buildBranch,
    IS_NETLIFY: isNetlifyBuild ? 'true' : '',
  },
  async headers() {
    return [
      {
        // Public review endpoints allow cross-origin auditing
        source: '/review/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'X-Robots-Tag', value: 'index, follow, all' },
        ],
      },
      {
        // Review manifest
        source: '/review-export/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
        ],
      },
    ];
  },
};

export default nextConfig;
