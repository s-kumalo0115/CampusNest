FROM nginx:alpine

COPY app/pages /usr/share/nginx/html
COPY app/css /usr/share/nginx/html/css
COPY app/js /usr/share/nginx/html/js
COPY app/assets /usr/share/nginx/html/assets

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
