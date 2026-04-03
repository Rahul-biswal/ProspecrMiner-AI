FROM ghcr.io/puppeteer/puppeteer:latest

ENV NODE_ENV=production

# The Puppeteer image uses a non-root user 'pptruser'
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY --chown=pptruser:pptruser package*.json ./
RUN npm install

# Copy all other backend source files
COPY --chown=pptruser:pptruser . .

EXPOSE 3001

CMD ["npm", "start"]
