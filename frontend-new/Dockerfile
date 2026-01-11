# Frontend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start the development server with host flag for Docker
CMD ["npm", "run", "dev", "--", "--host"]
