#!/bin/bash
# Start script for Atelier — Haute Parfumerie Community & Marketplace
echo "🏛️ Starting Atelier Perfume Community Marketplace..."
PORT="${1:-8080}"
python3 server.py "$PORT"
