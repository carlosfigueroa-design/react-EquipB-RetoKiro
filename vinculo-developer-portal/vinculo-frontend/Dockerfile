# ─── VÍNCULO Frontend — Multi-stage Dockerfile ───────────
# Stage: Development with hot reload
# ──────────────────────────────────────────────────────────

FROM node:20-alpine AS dev

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server with hot reload
CMD ["npm", "run", "dev"]
