FROM node:24-alpine

WORKDIR /app

# Copy all config and source files
COPY . .

# Install and build
RUN npm ci && npm run build

# Expose port
EXPOSE 3001

# Start
CMD ["node", "--env-file=.env", "dist/index.js"]
