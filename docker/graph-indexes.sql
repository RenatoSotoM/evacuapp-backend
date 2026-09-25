-- Ejecutar después de crear/importar graph_nodes y graph_edges.
CREATE INDEX IF NOT EXISTS idx_graph_nodes_geometry_gist
  ON graph_nodes USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_graph_edges_geometry_gist
  ON graph_edges USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_graph_nodes_geography_gist
  ON graph_nodes USING GIST ((geometry::geography));

CREATE INDEX IF NOT EXISTS idx_graph_edges_geography_gist
  ON graph_edges USING GIST ((geometry::geography));

CREATE INDEX IF NOT EXISTS idx_graph_edges_main_roads_gist
  ON graph_edges USING GIST ((geometry::geography))
  WHERE highway_type IN (
    'motorway', 'motorway_link', 'trunk', 'trunk_link',
    'primary', 'primary_link', 'secondary', 'secondary_link'
  );

CREATE INDEX IF NOT EXISTS idx_graph_edges_arterial_roads_gist
  ON graph_edges USING GIST ((geometry::geography))
  WHERE highway_type IN (
    'motorway', 'motorway_link', 'trunk', 'trunk_link',
    'primary', 'primary_link'
  );

CREATE INDEX IF NOT EXISTS idx_graph_edges_secondary_roads_gist
  ON graph_edges USING GIST ((geometry::geography))
  WHERE highway_type IN (
    'motorway', 'motorway_link', 'trunk', 'trunk_link',
    'primary', 'primary_link', 'secondary', 'secondary_link',
    'tertiary', 'tertiary_link'
  );

CREATE INDEX IF NOT EXISTS idx_incidents_location_gist
  ON incidents USING GIST (location);
