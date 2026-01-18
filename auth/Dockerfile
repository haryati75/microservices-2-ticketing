FROM node:22-alpine

# Update Alpine packages to reduce vulnerabilities
RUN apk update && apk upgrade

WORKDIR /app

# Copy all config and source files
COPY package.json .

# Install and build
RUN npm install --omit=dev
COPY . .

# Start
# CMD ["node", "--env-file=.env", "dist/index.js"]
CMD ["npx", "tsx", "watch", "src/index.ts"]
