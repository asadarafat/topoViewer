#!/usr/bin/env node
import { env } from './env.mjs';

function requireExactVersion(key) {
  const value = env[key];
  if (!/^\d+\.\d+\.\d+$/.test(value || '')) {
    throw new Error(`${key} must be pinned to an exact semantic version, got "${value}".`);
  }
  return value;
}

function requireExactImage(key, expected) {
  const value = env[key];
  if (value !== expected) {
    throw new Error(`${key} must be exactly "${expected}", got "${value}".`);
  }
  if (!value || value.includes(':latest') || !value.includes(':')) {
    throw new Error(`${key} must not use a floating image tag, got "${value}".`);
  }
}

const srlinuxVersion = requireExactVersion('SRLINUX_VERSION');
const gnmicVersion = requireExactVersion('GNMIC_VERSION');
const grafanaVersion = requireExactVersion('GRAFANA_VERSION');
const prometheusVersion = requireExactVersion('PROMETHEUS_VERSION');

requireExactImage('SRLINUX_IMAGE', `ghcr.io/nokia/srlinux:${srlinuxVersion}`);
requireExactImage('GNMIC_IMAGE', `ghcr.io/openconfig/gnmic:${gnmicVersion}`);
requireExactImage('GRAFANA_IMAGE', `grafana/grafana:${grafanaVersion}`);
requireExactImage('PROMETHEUS_IMAGE', `prom/prometheus:v${prometheusVersion}`);

if (!/^node:24\.\d+\.\d+-[a-z0-9.-]+$/.test(env.NORMALIZER_IMAGE || '')) {
  throw new Error(`NORMALIZER_IMAGE must be pinned to an exact Node 24 image tag, got "${env.NORMALIZER_IMAGE}".`);
}

console.log([
  'Containerlab Grafana lab images are pinned:',
  env.SRLINUX_IMAGE,
  env.GNMIC_IMAGE,
  env.GRAFANA_IMAGE,
  env.PROMETHEUS_IMAGE,
  env.NORMALIZER_IMAGE
].join(' '));

