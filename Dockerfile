# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Vite frontend and bundle the Express backend
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Set node environment
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Ensure the container listens on port 3000 
# (Cloud Run can easily route to this using --port=3000)
ENV PORT=3000
EXPOSE 3000

# Start the unified full-stack server
CMD ["npm", "start"]
