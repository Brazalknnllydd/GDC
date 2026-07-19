FROM node:22-alpine

WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Set environment variables (these should ideally be overridden at runtime)
ENV PORT=5000
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start the application
CMD ["npx", "tsx", "src/server.ts"]
