#!/bin/bash

# MCP Server Startup Script
# This script starts the Figma MCP server for local development

set -e

echo "Starting Figma MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 16+ to continue."
    exit 1
fi

# Navigate to MCP server directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_SERVER_DIR="$SCRIPT_DIR/../mcp-server"

if [ ! -d "$MCP_SERVER_DIR" ]; then
    echo "Error: MCP server directory not found at $MCP_SERVER_DIR"
    exit 1
fi

cd "$MCP_SERVER_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "Error: package.json not found in MCP server directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing MCP server dependencies..."
    npm install
fi

# Check if dependencies are up to date
echo "Checking dependencies..."
npm ci --only=production > /dev/null 2>&1 || {
    echo "Installing/updating dependencies..."
    npm install
}

# Set default port if not specified
export MCP_SERVER_PORT=${MCP_SERVER_PORT:-3001}

echo "Starting MCP server on port $MCP_SERVER_PORT..."
echo "Health check will be available at: http://localhost:$MCP_SERVER_PORT/mcp/health"
echo ""
echo "To stop the server, press Ctrl+C"
echo ""

# Start the server
exec npm start