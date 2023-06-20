# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=18.9.0
FROM node:${NODE_VERSION}-slim as base

# install openssl and sqlite3 for prisma
# ca-certificates and fuse3 for litefs
RUN apt-get update && apt-get install -y openssl sqlite3 openssh-client

LABEL fly_launch_runtime="Next.js/Prisma"

# Next.js/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/dev.db"
ENV SHADOW_DATABASE_URL="file:shadowdev.db"
ENV PORT="3000"


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential openssl 

# Install node modules
COPY --link package-lock.json package.json ./
RUN npm ci --include=dev

# Generate Prisma Client
# COPY --link prisma .
COPY prisma /app/prisma
RUN npx prisma generate

# Copy application code
COPY --link . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev

# Final stage for app image
FROM base

# Copy built application
# COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=build /app /app

# Entrypoint prepares the database.
ENTRYPOINT [ "/app/docker-entrypoint.js" ]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "npm", "run", "start" ]
