# useWebsocket

React hook and provider to integrate WebSockets into your React Components.

This is the development and contribution documentation.

Pull requests welcomed!

## 🏃 Getting started

The following command will install the dependencies.
After that it will run a watcher to watch the files, open storybook and also run the tests.

```
npm i && npm dev
```

## What's included?

- ⚡️[tsup](https://github.com/egoist/tsup) - The simplest and fastest way to bundle your TypeScript libraries. Used to bundle package as ESM and CJS modules. Supports TypeScript, Code Splitting, PostCSS, and more out of the box.
- 📖 [Storybook](https://storybook.js.org/) - Build UI components and pages in isolation. It streamlines UI development, testing, and documentation.
- 🧪 [Vitest](https://vitest.dev/) - A testing framework for JavaScript. Preconfigured to work with TypeScript and JSX.
- 🔼 [Release-it](https://github.com/release-it/release-it/) - release-it is a command line tool to automatically generate a new GitHub Release and populates it with the changes (commits) made since the last release.
- 🐙 [Test & Publish via Github Actions](https://docs.github.com/en/actions) - CI/CD workflows for your package. Run tests on every commit plus integrate with Github Releases to automate publishing package to NPM and Storybook to Github Pages.
- 📄 [Commitizen](https://github.com/commitizen/cz-cli) — When you commit with Commitizen, you'll be prompted to fill out any required commit fields at commit time.
- 🐶 [Husky](https://github.com/typicode/husky) — Run scripts before committing.
- 🚫 [lint-staged](https://github.com/okonet/lint-staged) — Run linters on git staged files
- 🤖 [Dependabot](https://docs.github.com/en/code-security/dependabot) - Github powered dependency update tool that fits into your workflows. Configured to periodically check your dependencies for updates and send automated pull requests.
- ☑️ [ESLint](https://eslint.org/) - A linter for JavaScript. Includes a simple configuration for React projects based on the recommended ESLint and AirBnB configs.
- 🎨 [Prettier](https://prettier.io/) - An opinionated code formatter.
- 🏃‍♀️‍➡️ [TSX](https://github.com/privatenumber/tsx) - Execute TypeScript files with zero-config in a Node.js environment.

## Usage

### 💻 Developing

Watch and rebuild code with `tsup` and runs Storybook to preview your UI during development.

```console
npm dev
```

Run all tests and watch for changes

```console
npm test
```

### 🏗️ Building

Build package with `tsup` for production.

```console
npm build
```

### ▶️ Running files written in TypeScript

To execute a file written in TypeScript inside a Node.js environment, use the `tsx` command. This will detect your `tsconfig.json` and run the file with the correct configuration. This is perfect for running custom scripts while remaining type-safe.

```console
npm tsx ./path/to/file.ts
```

This is useful for running scripts, starting a server, or any other code you want to run while remaining type-safe.

### 🖇️ Linking

Often times you want to `link` this package to another project when developing locally, circumventing the need to publish to NPM to consume it.

In a project where you want to consume your package run:

```console
npm link @daphnesmit/use-websocket
```

Learn more about package linking [here](https://docs.npmjs.com/cli/v8/commands/npm-link).

### 📩 Committing

When you are ready to commit simply run the following command to get a well formatted commit message. All staged files will automatically be linted and fixed as well.

```console
npm commit
```

### 🔖 Releasing, tagging & publishing to NPM

Create a semantic version tag and publish to Github Releases. When a new release is detected a Github Action will automatically build the package and publish it to NPM. Additionally, a Storybook will be published to Github pages.

Learn more about how to use the `release-it` command [here](https://github.com/release-it/release-it).

```console
npm release
```

When you are ready to publish to NPM simply run the following command:

```console
npm publish
```

#### 🤖 Auto publish after Github Release (or manually by dispatching the Publish workflow)

❗Important note: in order to automatically publish a Storybook on Github Pages you need to open your repository settings, navigate to "Actions" and enable **"Read & write permissions"** for Workflows. Then navigate to "Pages" and choose **"GitHub Actions"** as the source for the Build and Deployment. After a successful deployment you can find your Storybook at `https://<your-github-username>.github.io/<your-repository-name>/`.

❗Important note: in order to publish package to NPM you must add your token as a Github Action secret. Learn more on how to configure your repository and publish packages through Github Actions [here](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages).
