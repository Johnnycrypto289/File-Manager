#!/bin/bash

# Replit Deployment Script for Xero CFO Assistant Agent
# This script prepares the environment and starts the application

echo "Starting Xero CFO Assistant Agent deployment..."

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
  echo "Creating .env file from template..."
  cp .env.example .env
  echo "Please update the .env file with your actual credentials"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create database directory if it doesn't exist
mkdir -p ./data

# Check if database exists, if not initialize it
if [ ! -f ./data/database.sqlite ]; then
  echo "Initializing database..."
  node ./scripts/init-db.js
fi

# Start the application
echo "Starting application..."
npm start
