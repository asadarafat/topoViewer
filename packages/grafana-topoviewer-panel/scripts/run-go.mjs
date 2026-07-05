#!/usr/bin/env node
import { runGo } from './go-toolchain.mjs';

runGo(process.argv.slice(2));
