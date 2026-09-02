# Backend image for Railway.
#
# Lives in backend/ because the Railway service's Root Directory is /backend —
# a Dockerfile at the repo root is not in the build context and is silently
# ignored, which is why three deploys failed with `spawn maia3-uci ENOENT`.
#
# Needed because the backend runs Python alongside Node: Maia-3 is a PyTorch
# model executed as a child process. Railpack detects Node only, so nothing
# would install Python. With MAIA_ENABLED unset none of it is reached at
# runtime, but it must be present for the routes to work when the flag is on.

FROM node:22-slim

# python3-venv is packaged separately on Debian slim, and git is absent
# entirely — pip needs it to install maia3 from its GitHub URL.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Default model at runtime. Overridable with a MAIA_MODEL service variable —
# all three sizes are cached below, so switching needs no rebuild and no
# download. See src/maia/README.md for the size/latency trade-off.
ARG MAIA_MODEL=maia3-23m
ENV MAIA_MODEL=${MAIA_MODEL}

# Torch sizes its thread pool from the HOST's core count, not the container's CPU
# quota, then thrashes against that quota. Measured on 0.5 CPU: 4.2s per move
# unpinned versus 0.6s pinned to one thread — roughly 8x. Maia is a single
# forward pass, so extra threads buy nothing here anyway.
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1

ENV MAIA_VENV=/opt/maia-venv
# The engine probes this first. It also probes /opt/maia-venv by path, so a
# Railway service variable shadowing this cannot break startup.
ENV MAIA_UCI_COMMAND=${MAIA_VENV}/bin/python

# CPU-only torch — the default wheel drags in ~2.5GB of CUDA Railway cannot use.
RUN python3 -m venv ${MAIA_VENV} \
  && ${MAIA_VENV}/bin/pip install --no-cache-dir --upgrade pip \
  && ${MAIA_VENV}/bin/pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
  && ${MAIA_VENV}/bin/pip install --no-cache-dir "git+https://github.com/CSSLab/maia3.git" \
  # Fail the build here rather than at the first player's move.
  && ${MAIA_VENV}/bin/python -c "import maia3; print('maia3 import OK')"

# Weights are baked in before any source is copied, so a code change does not
# re-download 302MB.
# All three, so MAIA_MODEL can be changed from the Railway dashboard without a
# rebuild. Railway's filesystem is ephemeral, so a model that is not baked in
# would re-download on every restart, not just the first.
RUN for m in maia3-5m maia3-23m maia3-79m; do \
      ${MAIA_VENV}/bin/python -m maia3.cache --model "$m"; \
    done

WORKDIR /app

# Manifest first so the dependency layer survives source-only changes.
COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "run", "start"]
