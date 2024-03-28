#!/bin/env node
import { getFiles } from './sources.mjs'
import { execHook } from './hooks.mjs';
import * as linux from './linux/builder.mjs'

execHook("pre-build");

const files = await getFiles()

await linux.build(files)

execHook("post-build");
