#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceLabRoot = path.join(repoRoot, 'labs/grafana-topoviewer/containerlab');
const sourceBundlesRoot = path.join(repoRoot, 'labs/grafana-topoviewer/topoviewer-bundles');
const pluginDistRoot = path.join(repoRoot, 'packages/grafana-topoviewer-panel/dist');
const artifactRoot = path.join(repoRoot, '.artifacts');
const bundleName = 'topoviewer-grafana-containerlab-lab';
const bundleRoot = path.join(artifactRoot, bundleName);
const archivePath = path.join(artifactRoot, `${bundleName}.tar.gz`);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    stdio: options.stdio || 'pipe'
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout ? result.stdout.trim() : '';
}

function copyTree(source, target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, { recursive: true });
}

function writeText(filePath, content, mode) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  if (mode !== undefined) fs.chmodSync(filePath, mode);
}

function rewriteLabPaths() {
  const topologyPath = path.join(bundleRoot, 'st.clab.yml');
  const topology = fs.readFileSync(topologyPath, 'utf8')
    .replace('${TOPOVIEWER_GRAFANA_PLUGIN_DIST}:/var/lib/grafana/plugins/asadarafat-topoviewer-panel:ro', './grafana-plugin:/var/lib/grafana/plugins/asadarafat-topoviewer-panel:ro')
    .replace('../topoviewer-bundles:/etc/topoviewer/bundles:ro', './topoviewer-bundles:/etc/topoviewer/bundles:ro');
  fs.writeFileSync(topologyPath, topology);

  const envPath = path.join(bundleRoot, '.env');
  const env = fs.readFileSync(envPath, 'utf8')
    .replace(/^TOPOVIEWER_GRAFANA_PLUGIN_DIST=.*$/m, 'TOPOVIEWER_GRAFANA_PLUGIN_DIST=./grafana-plugin');
  fs.writeFileSync(envPath, env);

  const dashboardPath = path.join(bundleRoot, 'configs/grafana/dashboards/topoviewer-containerlab.json');
  const dashboard = fs.readFileSync(dashboardPath, 'utf8')
    .replace('Use `npm run grafana:clab:smoke` to capture healthy, high-utilization, and link-failure screenshots.', 'Use `./run.sh smoke` to validate local service readiness.');
  fs.writeFileSync(dashboardPath, dashboard);
}

function runScriptContent() {
  return `#!/usr/bin/env bash
set -euo pipefail

LAB_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
ACTION="\${1:-up}"

cd "\${LAB_DIR}"

if [[ -f .env ]]; then
  while IFS='=' read -r key value; do
    [[ -z "\${key}" || "\${key}" == \\#* ]] && continue
    if [[ -z "\${!key+x}" ]]; then
      export "\${key}=\${value}"
    fi
  done < .env
fi

find_clab() {
  if [[ -n "\${CONTAINERLAB_BIN:-}" ]]; then
    command -v "\${CONTAINERLAB_BIN}" >/dev/null 2>&1 && { printf '%s\\n' "\${CONTAINERLAB_BIN}"; return 0; }
  fi
  command -v containerlab >/dev/null 2>&1 && { printf '%s\\n' containerlab; return 0; }
  command -v clab >/dev/null 2>&1 && { printf '%s\\n' clab; return 0; }
  return 1
}

missing_containerlab() {
  cat >&2 <<'EOF'
[topoviewer] Containerlab is required to run this lab.

Install it on a disposable Linux lab machine, then rerun this script:

  curl -sL https://containerlab.dev/setup | sudo -E bash -s "all"

That command runs an external install script with sudo. Read it first on any
machine you care about.
EOF
}

require_command() {
  local command="$1"
  local label="$2"
  if ! command -v "\${command}" >/dev/null 2>&1; then
    echo "[topoviewer] \${label} is required." >&2
    exit 1
  fi
}

require_docker() {
  require_command docker Docker
  if ! docker version --format '{{.Server.Version}}' >/dev/null 2>&1; then
    echo "[topoviewer] Docker is installed but not usable by this shell." >&2
    exit 1
  fi
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn | awk '{print $4}' | grep -Eq "[:.]\${port}$"
    return $?
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"\${port}" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  return 1
}

check_ports() {
  local busy=0
  for entry in "Grafana:3000" "Prometheus:9090"; do
    local name="\${entry%%:*}"
    local port="\${entry##*:}"
    if port_in_use "\${port}"; then
      echo "[topoviewer] \${name} port \${port} is already in use. Stop the owner before deploying the upstream-shaped lab." >&2
      busy=1
    fi
  done
  [[ "\${busy}" == "0" ]]
}

print_urls() {
  cat <<EOF
Grafana TopoViewer Panel:
  http://127.0.0.1:3000/d/network-telemetry-topoviewer/network-telemetry-topoviewer

Prometheus:
  http://127.0.0.1:9090
EOF
}

wait_for_url() {
  local name="$1"
  local url="$2"
  local timeout="\${3:-90}"
  local started
  started="$(date +%s)"
  while true; do
    if curl -fsS "\${url}" >/dev/null 2>&1; then
      echo "[topoviewer] \${name} is ready: \${url}"
      return 0
    fi
    if (( $(date +%s) - started > timeout )); then
      echo "[topoviewer] \${name} did not become ready within \${timeout}s: \${url}" >&2
      return 1
    fi
    sleep 2
  done
}

up() {
  require_docker
  require_command curl curl
  local clab_bin
  if ! clab_bin="$(find_clab)"; then
    missing_containerlab
    exit 1
  fi
  check_ports
  cat <<EOF
[topoviewer] Starting disposable local Grafana Containerlab lab.
[topoviewer] Keep this on a trusted local host; lab services publish host ports.
EOF
  "\${clab_bin}" deploy -t st.clab.yml
  print_urls
}

down() {
  local clab_bin
  if ! clab_bin="$(find_clab)"; then
    echo "[topoviewer] Containerlab is not installed; nothing to destroy." >&2
    exit 0
  fi
  "\${clab_bin}" destroy -t st.clab.yml --cleanup
}

clean() {
  down || true
  rm -rf .artifacts
}

smoke() {
  require_command curl curl
  wait_for_url Grafana "http://127.0.0.1:3000/api/health"
  wait_for_url Prometheus "http://127.0.0.1:9090/api/v1/status/buildinfo"
  print_urls
}

case "\${ACTION}" in
  up)
    up
    ;;
  down)
    down
    ;;
  restart)
    down || true
    up
    ;;
  clean)
    clean
    ;;
  smoke)
    smoke
    ;;
  traffic:start)
    bash traffic.sh start all
    ;;
  traffic:status)
    docker ps --filter name=client --format 'table {{.Names}}\t{{.Status}}'
    ;;
  traffic:stop)
    bash traffic.sh stop all
    ;;
  *)
    cat >&2 <<'EOF'
Usage: ./run.sh {up|smoke|traffic:start|traffic:status|traffic:stop|down|restart|clean}
EOF
    exit 2
    ;;
esac
`;
}

function readmeContent() {
  return `# TopoViewer Grafana Containerlab Lab Bundle

This is a generated, self-contained local lab bundle for trying TopoViewer in
Grafana with Containerlab, gNMIc, Prometheus, mounted TopoViewer bundles, and
mapper-driven runtime overlays.

Start:

\`\`\`bash
./run.sh up
\`\`\`

Open:

\`\`\`text
http://127.0.0.1:3000/d/network-telemetry-topoviewer/network-telemetry-topoviewer
\`\`\`

Useful commands:

\`\`\`bash
./run.sh smoke
./run.sh traffic:start
./run.sh traffic:status
./run.sh traffic:stop
./run.sh down
./run.sh clean
\`\`\`

This lab is disposable validation scaffolding. It uses local ports, anonymous
Grafana Admin, unsigned local plugin loading, and demo credentials. Do not use
it as production deployment guidance.
`;
}

console.log('building Grafana panel plugin...');
run('npm', ['run', 'grafana:panel:build'], { stdio: 'inherit' });

fs.rmSync(bundleRoot, { recursive: true, force: true });
fs.mkdirSync(bundleRoot, { recursive: true });
copyTree(sourceLabRoot, bundleRoot);
copyTree(sourceBundlesRoot, path.join(bundleRoot, 'topoviewer-bundles'));
copyTree(pluginDistRoot, path.join(bundleRoot, 'grafana-plugin'));
fs.rmSync(path.join(bundleRoot, 'scripts'), { recursive: true, force: true });
fs.mkdirSync(path.join(bundleRoot, 'scripts'), { recursive: true });
fs.copyFileSync(
  path.join(sourceLabRoot, 'scripts/traffic.sh'),
  path.join(bundleRoot, 'scripts/traffic.sh')
);
fs.chmodSync(path.join(bundleRoot, 'scripts/traffic.sh'), 0o755);
rewriteLabPaths();
writeText(path.join(bundleRoot, 'run.sh'), runScriptContent(), 0o755);
writeText(path.join(bundleRoot, 'README.md'), readmeContent());

fs.rmSync(archivePath, { force: true });
run('tar', ['-czf', archivePath, bundleName], { cwd: artifactRoot });

console.log(`bundle directory: ${path.relative(repoRoot, bundleRoot)}`);
console.log(`bundle archive: ${path.relative(repoRoot, archivePath)}`);
