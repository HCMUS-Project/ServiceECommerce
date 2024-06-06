<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.<br>

[gRPC](https://docs.nestjs.com/microservices/grpc) config for service ecommerce.

# Installation

```bash
$ npm install
$ npm run gen:proto_folder
$ npm run gen:proto
$ npm run generate
```

# Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

# Env

```bash
# copy from example.env
$ cp example.env .env
```

# Migrate db with prisma

```bash
# migrate database with schema
$ migrate_name=<name> npm run migrate
```

`<name>`: is name folder migrate

### Example Commit Messages

```bash
# example migrate database
$ migrate_name="hello_word" npm run migrate
```

# Commit Guidelines

When making a commit to this project, please follow these guidelines to help keep our commit history clean and easy to understand.

## Commit Message Format

Each commit message should be formatted as follows:

```bash
<type>: <subject>
```

`<type>` is a descriptor representing the purpose of the commit. It can be one of the following:

-   `"feat"`: A new feature for the user; not a new feature for build script.
-   `"fix"`: A bug fix for the user; not a fix to a build script.
-   `"docs"`: Changes to documentation only.
-   `"style"`: Changes to the styling of the code (e.g., indentation, white-space, etc); no production code change.
-   `"refactor"`: Refactoring production code; no new feature or bug fix.
-   `"perf"`: A code change that improves performance.
-   `"test"`: Adding missing tests; no production code change.
-   `"chore"`: Changes to build process or auxiliary tools and libraries; no production code change.
-   `"ci"`: Changes to our Continuous Integration configuration files and scripts.
-   `"revert"`: Reverts a previous commit.

`<subject>` is a brief description of the changes, written in the imperative, present tense.

## Example Commit Messages

-   `"feat: add search functionality"`
-   `"fix: resolve issue with user login"`
-   `"docs: update API endpoint documentation"`
-   `"style: convert tabs to spaces"`
-   `"refactor: simplify API request logic"`
-   `"perf: improve load time for user list"`
-   `"test: add unit tests for user registration"`
-   `"chore: update build script"`
-   `"ci: add Dockerfile"`
-   `"revert: undo last commit"`
