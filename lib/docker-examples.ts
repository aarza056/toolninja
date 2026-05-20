export interface DockerExample {
  name: string;
  description: string;
  command: string;
}

export const DOCKER_EXAMPLES: DockerExample[] = [
  {
    name: "Nginx Web Server",
    description: "Static file server with custom port",
    command: `docker run -d \\
  --name nginx \\
  --restart unless-stopped \\
  -p 80:80 \\
  -v /srv/www:/usr/share/nginx/html:ro \\
  --memory 128m \\
  nginx:1.25.3`,
  },
  {
    name: "PostgreSQL Database",
    description: "Production-ready Postgres with persistent data",
    command: `docker run -d \\
  --name postgres \\
  --restart unless-stopped \\
  -p 5432:5432 \\
  -e POSTGRES_USER=app \\
  -e POSTGRES_PASSWORD=\${DB_PASSWORD} \\
  -e POSTGRES_DB=appdb \\
  -v pgdata:/var/lib/postgresql/data \\
  --memory 512m \\
  --health-cmd "pg_isready -U app" \\
  --health-interval 10s \\
  --health-timeout 5s \\
  --health-retries 5 \\
  postgres:16.1`,
  },
  {
    name: "Redis Cache",
    description: "Redis with AOF persistence and password",
    command: `docker run -d \\
  --name redis \\
  --restart unless-stopped \\
  -p 6379:6379 \\
  -v redis-data:/data \\
  --memory 256m \\
  --health-cmd "redis-cli ping" \\
  --health-interval 10s \\
  redis:7.2-alpine redis-server --appendonly yes --requirepass \${REDIS_PASSWORD}`,
  },
  {
    name: "Node.js Application",
    description: "Node app with env file and custom network",
    command: `docker run -d \\
  --name myapp \\
  --restart unless-stopped \\
  -p 3000:3000 \\
  --env-file .env \\
  -e NODE_ENV=production \\
  -v /app/uploads:/usr/src/app/uploads \\
  --network app-network \\
  --memory 256m \\
  --user node \\
  myapp:2.1.0`,
  },
  {
    name: "MySQL Database",
    description: "MySQL 8 with named volume and healthcheck",
    command: `docker run -d \\
  --name mysql \\
  --restart unless-stopped \\
  -p 3306:3306 \\
  -e MYSQL_ROOT_PASSWORD=\${MYSQL_ROOT_PASSWORD} \\
  -e MYSQL_DATABASE=appdb \\
  -e MYSQL_USER=app \\
  -e MYSQL_PASSWORD=\${MYSQL_PASSWORD} \\
  -v mysql-data:/var/lib/mysql \\
  --memory 512m \\
  --health-cmd "mysqladmin ping -h localhost" \\
  --health-interval 10s \\
  mysql:8.2`,
  },
  {
    name: "Traefik Reverse Proxy",
    description: "Traefik with Docker socket and dashboard",
    command: `docker run -d \\
  --name traefik \\
  --restart unless-stopped \\
  -p 80:80 \\
  -p 443:443 \\
  -p 8080:8080 \\
  -v /var/run/docker.sock:/var/run/docker.sock:ro \\
  -v traefik-certs:/etc/traefik/acme \\
  --network web \\
  --memory 128m \\
  traefik:v3.0 \\
  --api.dashboard=true --providers.docker=true --entrypoints.web.address=:80`,
  },
  {
    name: "Grafana Dashboard",
    description: "Grafana with persistent storage and SMTP",
    command: `docker run -d \\
  --name grafana \\
  --restart unless-stopped \\
  -p 3000:3000 \\
  -e GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD} \\
  -e GF_SMTP_ENABLED=true \\
  -e GF_SMTP_HOST=smtp.example.com:587 \\
  -v grafana-data:/var/lib/grafana \\
  --network monitoring \\
  --memory 256m \\
  --user "472" \\
  grafana/grafana:10.2.2`,
  },
  {
    name: "MongoDB",
    description: "MongoDB with auth and replica set ready",
    command: `docker run -d \\
  --name mongodb \\
  --restart unless-stopped \\
  -p 27017:27017 \\
  -e MONGO_INITDB_ROOT_USERNAME=admin \\
  -e MONGO_INITDB_ROOT_PASSWORD=\${MONGO_PASSWORD} \\
  -e MONGO_INITDB_DATABASE=appdb \\
  -v mongo-data:/data/db \\
  --memory 512m \\
  --health-cmd "mongosh --eval 'db.adminCommand({ ping: 1 })'" \\
  --health-interval 15s \\
  mongo:7.0`,
  },
  {
    name: "Caddy Web Server",
    description: "Caddy with automatic HTTPS and config volume",
    command: `docker run -d \\
  --name caddy \\
  --restart unless-stopped \\
  -p 80:80 \\
  -p 443:443 \\
  -v caddy-data:/data \\
  -v caddy-config:/config \\
  -v /srv/www:/srv:ro \\
  --network web \\
  --memory 64m \\
  --cap-add NET_ADMIN \\
  caddy:2.7-alpine`,
  },
  {
    name: "Prometheus Monitoring",
    description: "Prometheus with retention and custom config",
    command: `docker run -d \\
  --name prometheus \\
  --restart unless-stopped \\
  -p 9090:9090 \\
  -v prometheus-data:/prometheus \\
  -v /etc/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro \\
  --network monitoring \\
  --memory 512m \\
  --user nobody \\
  prom/prometheus:v2.48.0 \\
  --config.file=/etc/prometheus/prometheus.yml --storage.tsdb.retention.time=30d`,
  },
];
