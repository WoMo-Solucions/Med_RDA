FROM nginx:1.27-alpine

WORKDIR /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html ./index.html
COPY assets ./assets
COPY RUN_LOCAL.md ./RUN_LOCAL.md

EXPOSE 80
