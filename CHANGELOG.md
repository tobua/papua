# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.9](https://github.com/tobua/papua/compare/v0.1.8...v0.1.9) (2020-12-07)


### Bug Fixes

* **webpack:** typings for image imports ([0a8dbd1](https://github.com/tobua/papua/commit/0a8dbd1e070f3996c818fc553f536f49c8bdea40))

### [0.1.8](https://github.com/tobua/papua/compare/v0.1.7...v0.1.8) (2020-12-06)


### Bug Fixes

* **webpack:** make sure default public url works outside root ([149fc18](https://github.com/tobua/papua/commit/149fc18d2a91e6c8fbc4d905067ea4eb037ebd5c))

### [0.1.7](https://github.com/tobua/papua/compare/v0.1.6...v0.1.7) (2020-11-30)


### Features

* **template:** enhance PWA with markup and database ([b596c34](https://github.com/tobua/papua/commit/b596c34f41e39cf6756ff91fd638b7fe6178c0db))


### Bug Fixes

* **webpack:** enable source-maps in development ([5784619](https://github.com/tobua/papua/commit/57846192c84fd568d387930f1ee3e1eed46ce607))

### [0.1.6](https://github.com/tobua/papua/compare/v0.1.5...v0.1.6) (2020-11-27)


### Features

* **pwa:** optionally add service-worker entry ([e9f0a64](https://github.com/tobua/papua/commit/e9f0a64e8a9120089b6691a7edfdff46105ff7d3))
* **template:** add PWA code files ([7e1358e](https://github.com/tobua/papua/commit/7e1358e06c6453ce1abbb1be0ba8cf1f3356fe13))
* **template:** update template code ([b5e678c](https://github.com/tobua/papua/commit/b5e678c361fbc19c934586205b4e0a630c3e3e52))
* **webpack:** add workbox plugin to generate service worker PWA file ([0b41115](https://github.com/tobua/papua/commit/0b411157ee588b6c9d0cc9a874abbd9418bd76c0))
* **webpack:** inject configurable public url to define asset location ([11016a5](https://github.com/tobua/papua/commit/11016a5bcd39270a6251f26dccfc7f4d93981f53))


### Bug Fixes

* **template:** make sure variables kept intact for PWA template ([beba6f3](https://github.com/tobua/papua/commit/beba6f324fa321b646eddda1f5aa9fcc7cb8ea29))
* **webpack:** plugin will add the entry ([bc536c5](https://github.com/tobua/papua/commit/bc536c5d91f09bede949835a1bf9d074ce1a25b6))
* **webpack:** to is already set to output folder and fix template output ([f13efe5](https://github.com/tobua/papua/commit/f13efe5dd504204bf48fbbfb8b0238f54a159628))

### [0.1.5](https://github.com/tobua/papua/compare/v0.1.4...v0.1.5) (2020-11-16)


### Bug Fixes

* **webpack:** prevent error when copy folder missing ([8f74aed](https://github.com/tobua/papua/commit/8f74aed00fb4df91f36a2445bbd2cb2d3bb426ca))

### [0.1.4](https://github.com/tobua/papua/compare/v0.1.3...v0.1.4) (2020-11-15)


### Features

* **template:** Draft PWA template and necessary webpack changes ([a59e5e0](https://github.com/tobua/papua/commit/a59e5e0c190babe3c0a1c2d83d67fd65eea2473f))

### [0.1.3](https://github.com/tobua/papua/compare/v0.1.2...v0.1.3) (2020-11-15)


### Features

* **webpack:** add css support for legacy plugins ([2956362](https://github.com/tobua/papua/commit/2956362294bcc9da968a7dc0fddcca44cc4a7a25))

### [0.1.2](https://github.com/tobua/papua/compare/v0.1.1...v0.1.2) (2020-11-03)


### Features

* **webpack:** configurable title with package name as fallback ([4b30b56](https://github.com/tobua/papua/commit/4b30b56367cdc9e08b6977b84aac9084a54123dd))


### Bug Fixes

* **test:** change deprecated property for ts-jest ([d2135ff](https://github.com/tobua/papua/commit/d2135ff48c630630b8ddac5042f473e3b18abd17))

### [0.1.1](https://github.com/tobua/papua/compare/v0.1.0...v0.1.1) (2020-10-21)


### Bug Fixes

* **lint:** stylelint-vscode unable to load cjs ([3e80fc7](https://github.com/tobua/papua/commit/3e80fc7d16d45e40f1d8532566db08bcd4727c0d))
* **package:** switch merge order and update dependencies ([7ab49e7](https://github.com/tobua/papua/commit/7ab49e7c5d8d5e30533f1c7bf9cfe01ae83e65b1))
* **webpack:** adapt stats generation to new data structure ([936156f](https://github.com/tobua/papua/commit/936156fe3c480a769f070c3c9503648fbd8234b6))

## [0.1.0](https://github.com/tobua/papua/compare/v0.0.7...v0.1.0) (2020-10-11)


### ⚠ BREAKING CHANGES

* **configuration:** config is now always generated and should be ignored

### Features

* **configuration:** apply recent configuration changes from padua ([023854d](https://github.com/tobua/papua/commit/023854d9c303ece3f546096397b4b50281a2eddf))
* **lint:** add stylelint for css-in-js ([59dc0ff](https://github.com/tobua/papua/commit/59dc0ffa3b7321d97bba71c066380def8d3f1a04))


### Bug Fixes

* **configuration:** fix for newly added stylelint and tsconfig ([29dafcf](https://github.com/tobua/papua/commit/29dafcf3b907032fee2fa38283b419b8d9f09a97))
* **mobx:** remove decorator configuration as MobX 6 was released ([8788b27](https://github.com/tobua/papua/commit/8788b276bb8bd8521c6dce993dea65f158b757ad))
* **project:** proper imports and removing options coming from padua ([4603b19](https://github.com/tobua/papua/commit/4603b1995f475bde8e98021dd3d6bbea2dac61be))
* **script:** small fixes after integration test ([f8ad781](https://github.com/tobua/papua/commit/f8ad78102d85be3cee29d9f0ba379a81298fa1c0))

### [0.0.7](https://github.com/tobua/papua/compare/v0.0.6...v0.0.7) (2020-09-23)


### Bug Fixes

* **dependencies:** update dependencies ([d714133](https://github.com/tobua/papua/commit/d714133e1e9bf8c85394ffe4fdb2e3fbd819af2d))

### [0.0.6](https://github.com/tobua/papua/compare/v0.0.5...v0.0.6) (2020-09-23)


### Bug Fixes

* **eslint:** add more lint rules and update dependencies ([ac0d34c](https://github.com/tobua/papua/commit/ac0d34c6a13363872f7eacc33d03f48c94effcec))
* **template:** update version in templates ([29657bb](https://github.com/tobua/papua/commit/29657bb57871ffe48c817141ac354346500caf56))

### [0.0.5](https://github.com/tobua/papua/compare/v0.0.4...v0.0.5) (2020-09-05)


### Bug Fixes

* **format:** properly formatting messages ([f7c23d5](https://github.com/tobua/papua/commit/f7c23d59e667c8e326e4377928bcef3696b130ca))

### [0.0.4](https://github.com/tobua/papua/compare/v0.0.3...v0.0.4) (2020-09-05)


### Features

* **log:** use formatter for webpack messages and update logua ([ab299fe](https://github.com/tobua/papua/commit/ab299fe5cbf9472d2d3bbcbd6930cf835e016366))


### Bug Fixes

* **postinstall:** exiting with success code as desired behaviour ([c2299d7](https://github.com/tobua/papua/commit/c2299d728fcdfd489d4a2b9530f5d7e0cbb683d0))

### [0.0.3](https://github.com/tobua/papua/compare/v0.0.2...v0.0.3) (2020-08-31)


### Bug Fixes

* **general:** more usage of logua and updating dependencies ([ab52bee](https://github.com/tobua/papua/commit/ab52bee0ea1284a07faf9c8b065d4304ba1fb6de))

### [0.0.2](https://github.com/tobua/papua/compare/v0.0.1...v0.0.2) (2020-08-31)


### Bug Fixes

* **javascript:** no TypeScript plugin when JS active ([2935fe0](https://github.com/tobua/papua/commit/2935fe055b30b9d65817199ec9999ed86fd0a17a))
* **typescript:** fix missing files error and remove paths plugin ([eed49b3](https://github.com/tobua/papua/commit/eed49b368a034bca221537e1b2955b073216e381))

### [0.0.1](https://github.com/tobua/papua/compare/v0.0.0...v0.0.1) (2020-08-30)

## 0.0.0 (2020-08-30)


### Features

* **configuration:** user configuration for webpack ([c9649bb](https://github.com/tobua/papua/commit/c9649bbd30dbdd6f7a7d4809898d426701a42a63))
* **general:** add jsconfig, check template location and add test script ([081c83e](https://github.com/tobua/papua/commit/081c83e6080b0f1705958d0e94e1fd18d3de9124))
* **general:** several small improvements ([3684beb](https://github.com/tobua/papua/commit/3684beb45a6959abfdddc481d356dd5aa3e78eeb))
* **general:** various small improvements ([59f2bcc](https://github.com/tobua/papua/commit/59f2bcc9f30265799d4703f4f6766e0422880f6a))
* **general:** various small tweaks ([4164b5e](https://github.com/tobua/papua/commit/4164b5efe51244be71e14acb91aeee02b538c6e8))
* **install:** postinstall script to merge package config ([6bfd00c](https://github.com/tobua/papua/commit/6bfd00ce2c7320f73785c54d277217e36fdb3592))
* **lint:** improving linter script and adding TypeScript support ([1169c71](https://github.com/tobua/papua/commit/1169c718ce6fddf8eb76f1f49d459b4b7805c29b))
* **log:** custom compiler logs ([bc493c4](https://github.com/tobua/papua/commit/bc493c48acdf33d6290b45b9c3aeb63382f5ccdc))
* **options:** get options and prepare typescript integration ([49c0d4b](https://github.com/tobua/papua/commit/49c0d4b5a0ece617068c973e25dd42ea3cf6760a))
* **setup:** basic implementation and project structure ([9b67821](https://github.com/tobua/papua/commit/9b678217820320149449511e3b741d8a9f7fdccb))
* **start:** webpack dev server for start script ([b1c42ca](https://github.com/tobua/papua/commit/b1c42ca3e6d2a0f32229a81fdd07eab8cdb22b2b))
* **stats:** improve how stats are displayed ([b54ea2c](https://github.com/tobua/papua/commit/b54ea2c52f4cbfc3cb923e9a9f3c86a16ec54b74))
* **template:** add default and TypeScript template ([5cfd0df](https://github.com/tobua/papua/commit/5cfd0df488fd067854d82a416846e3e6d59bd6fa))
* **typescript:** extending tsconfig ([8850d02](https://github.com/tobua/papua/commit/8850d02325c950c8be31b5a13fd1e7629b75cf40))
* **update:** update dependencies script and logo ([6f1aefe](https://github.com/tobua/papua/commit/6f1aefef820a5aef0f52a9036327c9efa2ae3fd9))
* **webpack:** file-loader for images ([8944d46](https://github.com/tobua/papua/commit/8944d463df233ec4f51449399db2c3d8f5b3bda5))
* **webpack:** make sure dev-server works with routing ([698aaee](https://github.com/tobua/papua/commit/698aaee19d428250845d0462270b41029bbde12b))


### Bug Fixes

* **process:** make sure process always exits ([9fea33e](https://github.com/tobua/papua/commit/9fea33eec94a2dbb7c585c2e3636a4ddad46f2fd))
