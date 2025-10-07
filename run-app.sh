sudo killall node
sudo killall ssh
echo "Starting SSH tunnel..."
nohup ssh -N -L3306:prod-4iiii-db.csjvti7yzqxd.us-west-2.rds.amazonaws.com:3306 ubuntu@mfg.4iiiize.com > ssh-tunnel.log 2>&1 &

echo "Waiting for tunnel to initialize..."
for i in {1..10}; do
  lsof -iTCP:3307 -sTCP:LISTEN | grep ssh && break
  sleep 1
done

echo "Starting backend..."
nohup bash -c "(cd backend && node index.js > ../backend.log 2>&1 &)"

echo "Starting frontend..."
nohup bash -c "(cd frontend && npm start > ../frontend.log 2>&1 &)"
