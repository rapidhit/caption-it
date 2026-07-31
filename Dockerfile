FROM node:20-bookworm-slim

# ffmpeg (with libass) + fontconfig + tools to fetch fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg fontconfig ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*

# Install the caption fonts so libass renders exactly what the studio previews.
# Family names must match the studio's font list (Anton, Bebas Neue, etc).
RUN mkdir -p /usr/share/fonts/truetype/caption && cd /usr/share/fonts/truetype/caption \
 && wget -qO Anton.ttf         https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf \
 && wget -qO BebasNeue.ttf     https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf \
 && wget -qO ArchivoBlack.ttf  https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf \
 && wget -qO Montserrat.ttf    "https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf" \
 && wget -qO Inter.ttf         "https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf" \
 && fc-cache -f

WORKDIR /app

# Install deps first for better layer caching
COPY package.json ./
RUN npm install

# Build the frontend
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.js"]
