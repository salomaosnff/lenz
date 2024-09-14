#!/bin/bash

export LENZ_BASE_URL="http://localhost:5173/"

PID_RUST=
PID_VITE=

FRONTEND_PATH="$(pwd)/frontend/packages/app"
SERVER_PATH="$(pwd)/agent/server"

node builder/src/plain.mjs --no-frontend --no-backend

start_frontend(){
  echo "Starting frontend..."
  cd frontend
  
  echo "Starting vite project in development mode...."
  pnpm dev &

  PID_VITE=$!

  cd ..

  echo "Waiting for $LENZ_BASE_URL to be available..."

  while true; do
    curl -s $LENZ_BASE_URL > /dev/null
    if [ $? -eq 0 ]; then
      break
    fi
    sleep 1
  done
}

start_backend(){
  cd $SERVER_PATH
  cargo watch -x "run" &
  PID_RUST=$!

  cd ..
}

start_frontend
start_backend

# Função para lidar com SIGINT (Ctrl+C)
cleanup() {
  echo "\nEncerrando processos..."
  kill $PID_RUST $PID_VITE
  wait $PID_RUST $PID_VITE
  exit 0
}

# Captura o SIGINT (Ctrl+C) e executa a função cleanup
trap cleanup SIGINT

# Aguarda os processos filhos
wait $PID_RUST $PID_VITE