FROM node:20-alpine

WORKDIR /app

# Install libc compatibility layer for alpine
RUN apk add --no-cache libc6-compat

# Install dependencies based on package.json
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_STOREFRONT_URL=http://localhost:3000
ENV NEXT_PUBLIC_STOREFRONT_URL=$NEXT_PUBLIC_STOREFRONT_URL

EXPOSE 3001

CMD ["npm", "run", "dev"]
