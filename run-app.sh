#!/usr/bin/env bash
# initial startup line (already logged even before redirect so Wayfire can see it)
# echo "$(date) run-app.sh started (PID $$) env: $XDG_SESSION_TYPE $WAYLAND_DISPLAY $DISPLAY" >> /tmp/run-app-autostart.log

# Redirect all subsequent stdout/stderr to the autostart log so Wayfire/autostart can
# capture what the script does. Also enable tracing with timestamps so each executed
# command and its output are recorded.
# exec >> /tmp/run-app-autostart.log 2>&1
# export PS4='+ $(date "+%Y-%m-%d %H:%M:%S")\011 '
# set -x

sudo killall node
sudo killall ssh
cd $(dirname $0) || exit 1
sleep 1

echo "Starting SSH tunnel..."
nohup ssh -N -L3306:prod-4iiii-db.csjvti7yzqxd.us-west-2.rds.amazonaws.com:3306 ubuntu@mfg.4iiiize.com > ssh-tunnel.log 2>&1 &

echo "Waiting for tunnel to initialize..."
for i in {1..10}; do
  lsof -iTCP:3307 -sTCP:LISTEN | grep ssh && break
  sleep 1
done

echo "Starting backend..."
nohup bash -c "(cd ./backend && node index.js > ../backend.log 2>&1 &)"

echo "Starting frontend..."
nohup bash -c "(cd ./frontend && npm start > ../frontend.log 2>&1 &)"
