FROM iboates/osm2pgsql:latest

RUN apk add --no-cache bash curl postgresql-client ca-certificates

COPY docker/ingestion/entrypoint.sh /usr/local/bin/graph-ingestion
COPY docker/ingestion/roads.lua /opt/graph-ingestion/roads.lua
COPY docker/graph-indexes.sql /opt/graph-ingestion/graph-indexes.sql
RUN chmod +x /usr/local/bin/graph-ingestion

ENTRYPOINT ["graph-ingestion"]
