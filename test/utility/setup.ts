import { beforeEach, afterEach, vi } from 'vitest'
import { registerVitest } from 'jest-fixture'
import { refresh } from '../../utility/helper'
// Used to set project paths to fixture during tests.
process.env.PAPUA_TEST = process.cwd()
// Register Vitest globals for jest-fixture
registerVitest(beforeEach, afterEach, vi)
// Refresh options (package.json) cache.
beforeEach(refresh)
