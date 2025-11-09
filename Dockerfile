# --- Stage 1: Build the React App ---
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Define the build argument to receive the key from Cloud Build
ARG GEMINI_API_KEY_ARG

# 2. Set the client-side environment variable (Vite prefix)
# This value will be hardcoded into the final JS bundle (insecure!)
ENV VITE_GEMINI_API_KEY=$GEMINI_API_KEY_ARG

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Build the application
COPY . .
# Run your standard build command (e.g., 'yarn build' for Vite)
RUN npm run build

# --- Stage 2: Serve the Static Files with Nginx ---
FROM nginx:1.25-alpine AS final

# Copy the build output from the builder stage
# Assuming your build output directory is 'dist' (standard for Vite)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy a custom Nginx config to ensure history mode routing works (if applicable)
# If your app uses client-side routing, you need this to redirect all paths to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run defaults to port 8080
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]