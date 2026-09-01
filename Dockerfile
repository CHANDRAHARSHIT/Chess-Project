# Backend image for Railway.
#
# A Dockerfile rather than nixpacks.toml because Railway's builder default moved
# to Railpack, which ignores nixpacks.toml silently — the first two deploys
# failed with `spawn maia3-uci ENOENT` because the Python install never ran.
# A Dockerfile is honoured whatever the builder setting is.
#
# The backend needs Python alongside Node: Maia-3 is a PyTorch model that runs as
# a child process. With MAIA_ENABLED unset none of it is reached at runtime, but
# it still has to be present for the routes to work when the flag is on.

FROM node:22-slim

# python3-venv is separate from python3 on Debian slim, and git is absent
# entirely — pip needs it to install maia3 from its GitHub URL.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV MAIA_VENV=/opt/maia-venv
# The engine probes this interpreter first; without it, it falls back to whatever
# `python3` resolves to, which is not this venv.
ENV MAIA_UCI_COMMAND=${MAIA_VENV}/bin/python

# CPU-only torch — the default wheel drags in ~2.5GB of CUDA that Railway cannot use.
RUN python3 -m venv ${MAIA_VENV} \
  && ${MAIA_VENV}/bin/pip install --no-cache-dir --upgrade pip \
  && ${MAIA_VENV}/bin/pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
  && ${MAIA_VENV}/bin/pip install --no-cache-dir "git+https://github.com/CSSLab/maia3.git" \
  # Fail the build here rather than at the first player's move.
  && ${MAIA_VENV}/bin/python -c "import maia3; print('maia3 import OK')"

# Weights are baked in here, before any source is copied, so a code change does
# not re-download 302MB. Without this the first player waits on the download.
RUN ${MAIA_VENV}/bin/python -m maia3.cache --model maia3-79m

WORKDIR /app

# Manifests first so dependency layers survive source-only changes.
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
# Installs every workspace: npm ci needs each workspace's package.json to match
# the lockfile, and the frontend's is copied above for exactly that reason.
RUN npm ci

COPY backend ./backend
RUN npm run build -w backend

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "backend"]
