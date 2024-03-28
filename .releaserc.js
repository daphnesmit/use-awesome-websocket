module.exports = {
  branches: [
    'main',
    {
      name: 'develop',
      prerelease: true,
    },
  ],
  plugins: [
    '@semantic-release/npm',
    '@semantic-release/github',
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
  ],
};
