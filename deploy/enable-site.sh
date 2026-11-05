#!/usr/bin/env bash
# Подключает сайт к уже работающему nginx за Xray (VPN не затрагивается).
#   sudo bash deploy/enable-site.sh case.songoku.ru
set -euo pipefail
DOMAIN="${1:?укажите домен, например case.songoku.ru}"
DIR="$(cd "$(dirname "$0")" && pwd)"

# 1) Сертификат Let's Encrypt (порт 80 свободен — тем же способом выпущены остальные сертификаты сервера).
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  certbot certonly --standalone --non-interactive --agree-tos --register-unsafely-without-email -d "$DOMAIN"
fi

# 2) Конфиг сайта + include в nginx.conf (рядом с остальными сайтами).
sed "s/__DOMAIN__/$DOMAIN/g" "$DIR/nginx-casebattle.conf" > /etc/nginx/casebattle.conf
if ! grep -q "include /etc/nginx/casebattle.conf;" /etc/nginx/nginx.conf; then
  cp /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.bak.$(date +%s)"
  sed -i '0,/include \/etc\/nginx\/songoku-site.conf;.*/s//&\n    include \/etc\/nginx\/casebattle.conf;   # сайт CaseClash/' /etc/nginx/nginx.conf
  grep -q "include /etc/nginx/casebattle.conf;" /etc/nginx/nginx.conf || { echo "Не нашёл, куда вставить include — добавьте вручную в блок http"; exit 1; }
fi

# 3) Проверка и мягкая перезагрузка (при ошибке nginx продолжит работать со старой конфигурацией).
nginx -t
systemctl reload nginx
echo "Готово: https://$DOMAIN"
