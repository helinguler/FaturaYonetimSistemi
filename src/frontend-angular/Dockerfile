FROM node:22-alpine AS build
WORKDIR /app

COPY src/frontend-angular/package*.json ./
RUN npm ci

COPY src/frontend-angular/ ./
RUN npm run build

RUN mkdir -p /app/output && \
    if [ -d "dist/frontend-angular/browser" ]; then \
      cp -r dist/frontend-angular/browser/* /app/output; \
    else \
      cp -r dist/frontend-angular/* /app/output; \
    fi

FROM nginx:alpine AS final

COPY src/frontend-angular/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/output /usr/share/nginx/html

EXPOSE 80