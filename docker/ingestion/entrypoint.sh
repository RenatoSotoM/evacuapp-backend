#!/bin/bash
set -Eeuo pipefail

PBF_PATH=/data/chile-latest.osm.pbf
STARTED_AT=$(date +%s)

if [ ! -s "$PBF_PATH" ]; then
  echo "Missing $PBF_PATH. Download it on the host before starting ingestion."
  exit 2
fi

until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE"; do
  sleep 2
done

psql -v ON_ERROR_STOP=1 <<'SQL'
CREATE EXTENSION IF NOT EXISTS postgis;
DROP TABLE IF EXISTS graph_edges;
DROP TABLE IF EXISTS graph_nodes;
DROP TABLE IF EXISTS osm_roads;
DROP TABLE IF EXISTS osm2pgsql_properties;
SQL

osm2pgsql \
  --database "$PGDATABASE" \
  --host "$PGHOST" \
  --port "$PGPORT" \
  --username "$PGUSER" \
  --create \
  --slim \
  --output flex \
  --style /opt/graph-ingestion/roads.lua \
  "$PBF_PATH"

psql -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE graph_nodes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  geometry geometry(Point, 4326) NOT NULL,
  node_key text NOT NULL UNIQUE
);

CREATE TABLE graph_edges (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  node_from integer NOT NULL REFERENCES graph_nodes(id),
  node_to integer NOT NULL REFERENCES graph_nodes(id),
  distance double precision NOT NULL,
  weight double precision NOT NULL,
  oneway boolean NOT NULL DEFAULT false,
  highway_type varchar(50) NOT NULL,
  accessible boolean NOT NULL DEFAULT true,
  geometry geometry(LineString, 4326) NOT NULL
);

CREATE TEMP TABLE road_points AS
SELECT
  r.way_id,
  r.highway_type,
  r.oneway,
  r.accessible,
  p.path[1] AS point_order,
  p.geom::geometry(Point, 4326) AS geometry,
  encode(ST_AsEWKB(ST_SnapToGrid(p.geom::geometry(Point, 4326), 0.0000001)), 'hex') AS node_key
FROM osm_roads r
CROSS JOIN LATERAL ST_DumpPoints(r.geom) p;

INSERT INTO graph_nodes (geometry, node_key)
SELECT DISTINCT ON (node_key) geometry, node_key
FROM road_points
ORDER BY node_key;

INSERT INTO graph_edges (
  node_from, node_to, distance, weight, oneway, highway_type, accessible, geometry
)
SELECT
  from_node.id,
  to_node.id,
  ST_Length(segment.geometry::geography),
  ST_Length(segment.geometry::geography),
  segment.oneway,
  segment.highway_type,
  segment.accessible,
  segment.geometry
FROM (
  SELECT
    rp.way_id,
    rp.highway_type,
    rp.oneway,
    rp.accessible,
    rp.node_key AS from_key,
    LEAD(rp.node_key) OVER (PARTITION BY rp.way_id ORDER BY rp.point_order) AS to_key,
    ST_MakeLine(
      rp.geometry,
      LEAD(rp.geometry) OVER (PARTITION BY rp.way_id ORDER BY rp.point_order)
    )::geometry(LineString, 4326) AS geometry
  FROM road_points rp
) segment
JOIN graph_nodes from_node ON from_node.node_key = segment.from_key
JOIN graph_nodes to_node ON to_node.node_key = segment.to_key
WHERE segment.to_key IS NOT NULL
  AND NOT ST_IsEmpty(segment.geometry);

DROP TABLE osm_roads;
\i /opt/graph-ingestion/graph-indexes.sql
ANALYZE graph_nodes;
ANALYZE graph_edges;

SELECT COUNT(*) AS graph_nodes_total FROM graph_nodes;
SELECT COUNT(*) AS graph_edges_total FROM graph_edges;
SELECT pg_size_pretty(pg_total_relation_size('graph_nodes')) AS graph_nodes_size;
SELECT pg_size_pretty(pg_total_relation_size('graph_edges')) AS graph_edges_size;
SQL

echo "Graph ingestion completed in $(( $(date +%s) - STARTED_AT )) seconds"
