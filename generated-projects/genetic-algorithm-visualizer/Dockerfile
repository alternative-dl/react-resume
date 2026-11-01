FROM nginx:alpine
COPY app /usr/share/nginx/html
# Cloud Run provides $PORT; make nginx listen on it.
RUN sed -i 's/listen\s*80;/listen 8080;/' /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
