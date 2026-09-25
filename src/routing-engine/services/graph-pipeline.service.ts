import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BoundingBoxProfileDto, TravelMode } from '../dto/bounding-box-profile.dto';

type GraphCoordinate = { lat: number; lon: number };
type GeoJsonLineString = { coordinates: [number, number][] };

function parseJsonValue<T>(value: T | string): T {
  return typeof value === 'string' ? (JSON.parse(value) as T) : value;
}

function parseQueryRows<T>(value: unknown): T[] {
  const rows = typeof value === 'string' ? JSON.parse(value) : value;
  if (!Array.isArray(rows)) {
    throw new TypeError('La consulta del grafo debe devolver un arreglo de filas.');
  }
  return rows as T[];
}

export interface GraphResponse {
  profileApplied: Pick<BoundingBoxProfileDto, 'travelMode' | 'isReducedMobility'> & {
    radiusMeters?: number;
    ringMin?: number;
    ringMax?: number;
  };
  nodes: Array<{ id: number; lat: number; lon: number }>;
  edges: Array<{
    id: number;
    nodeFrom: number;
    nodeTo: number;
    fromId: number;
    toId: number;
    source: number;
    target: number;
    distance: number;
    weight: number;
    oneway: boolean;
    highwayType: string;
    geometry: GraphCoordinate[];
  }>;
}

@Injectable()
export class GraphPipelineService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async buildGraph(dto: BoundingBoxProfileDto): Promise<GraphResponse> {
    const hasCenter = dto.centerLat !== undefined && dto.centerLon !== undefined;
    const hasRing = dto.ringMin !== undefined || dto.ringMax !== undefined;
    const hasBoundingBox =
      dto.minLat !== undefined &&
      dto.minLon !== undefined &&
      dto.maxLat !== undefined &&
      dto.maxLon !== undefined;

    if (!hasCenter && !hasBoundingBox) {
      throw new BadRequestException(
        'Debe indicar centerLat/centerLon o un bounding box completo.',
      );
    }

    if (hasRing && !hasCenter) {
      throw new BadRequestException('Los anillos requieren centerLat y centerLon.');
    }

    if (hasRing && (dto.ringMin === undefined || dto.ringMax === undefined)) {
      throw new BadRequestException('Debe indicar ringMin y ringMax juntos.');
    }

    const radiusMeters =
      dto.radiusMeters ?? (dto.travelMode === TravelMode.PEDESTRIAN ? 15000 : 30000);
    const ringMin = dto.ringMin ?? 0;
    const ringMax = dto.ringMax ?? radiusMeters;

    if (hasCenter && ringMin >= ringMax) {
      throw new BadRequestException('ringMin debe ser menor que ringMax.');
    }

    const pointParameters = hasCenter ? [dto.centerLon, dto.centerLat, ringMax, ringMin] : [];
    const spatialCondition = hasCenter
      ? `ST_DWithin(e.geometry::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
         AND ($4 = 0 OR NOT ST_DWithin(
           e.geometry::geography,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           $4
         ))`
      : 'ST_Intersects(e.geometry, ST_MakeEnvelope($1, $2, $3, $4, 4326))';

    if (hasBoundingBox && (dto.minLat! >= dto.maxLat! || dto.minLon! >= dto.maxLon!)) {
      throw new BadRequestException(
        'El bounding box debe tener minLat/minLon menores que maxLat/maxLon.',
      );
    }

    const conditions = [
      spatialCondition,
      dto.travelMode === TravelMode.PEDESTRIAN
        ? "e.highway_type NOT IN ('motorway', 'motorway_link')"
        : "e.highway_type NOT IN ('footway', 'pedestrian', 'steps')",
    ];
    if (hasCenter && ringMin >= 15000) {
      conditions.push(
        "e.highway_type IN ('motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link')",
      );
    } else if (hasCenter && ringMin >= 5000) {
      conditions.push(
        "e.highway_type IN ('motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link')",
      );
    }
    const parameters: unknown[] = hasCenter
      ? pointParameters
      : [dto.minLon, dto.minLat, dto.maxLon, dto.maxLat];
    const incidentParameterIndex = parameters.length + 1;
    const travelModeParameterIndex = parameters.length + 2;

    if (dto.isReducedMobility) {
      conditions.push('e.accessible = true', "e.highway_type <> 'steps'");
    }

    if (dto.avoidIncidents) {
      conditions.push(
        `NOT EXISTS (
          SELECT 1
          FROM incidents i
          WHERE i.status IN ('PENDING', 'VERIFIED')
            AND ST_Intersects(e.geometry, i.location)
        )`,
      );
    }

    const edgeQueryResult = await this.dataSource.query(
      `SELECT
        e.id,
        e.node_from AS "nodeFrom",
        e.node_to AS "nodeTo",
        e.distance,
        CASE WHEN $${incidentParameterIndex}::boolean AND EXISTS (
          SELECT 1 FROM incidents i
          WHERE i.status IN ('PENDING', 'VERIFIED')
            AND ST_DWithin(e.geometry::geography, i.location::geography, 25)
        ) THEN e.weight * 10 ELSE e.weight END AS weight,
        CASE WHEN $${travelModeParameterIndex}::text = 'pedestrian' THEN false ELSE e.oneway END AS oneway,
        e.highway_type AS "highwayType",
        ST_AsGeoJSON(e.geometry)::json AS geometry
       FROM graph_edges e
       WHERE ${conditions.join(' AND ')}`,
      [...parameters, dto.avoidIncidents, dto.travelMode],
    );
    const edgeRows = parseQueryRows<{
      id: number;
      nodeFrom: number;
      nodeTo: number;
      distance: number;
      weight: number;
      oneway: boolean;
      highwayType: string;
      geometry: GeoJsonLineString | string;
    }>(edgeQueryResult).map((edge) => ({
      ...edge,
      geometry: parseJsonValue<GeoJsonLineString>(edge.geometry),
    }));

    const nodeIds = [...new Set(edgeRows.flatMap((edge) => [edge.nodeFrom, edge.nodeTo]))];
    const nodeQueryResult = nodeIds.length
      ? await this.dataSource.query(
          `SELECT id, ST_Y(geometry) AS lat, ST_X(geometry) AS lon
           FROM graph_nodes
           WHERE id = ANY($1::int[])`,
          [nodeIds],
        )
      : [];
    const nodeRows = parseQueryRows<{ id: number; lat: number; lon: number }>(
      nodeQueryResult,
    ).map((node) => ({
      id: Number(node.id),
      lat: Number(node.lat),
      lon: Number(node.lon),
    }));

    const mappedEdges: GraphResponse['edges'] = edgeRows.map((edge) => ({
      id: Number(edge.id),
      nodeFrom: Number(edge.nodeFrom),
      nodeTo: Number(edge.nodeTo),
      fromId: Number(edge.nodeFrom),
      toId: Number(edge.nodeTo),
      source: Number(edge.nodeFrom),
      target: Number(edge.nodeTo),
      distance: Number(edge.distance),
      weight: Number(edge.weight),
      oneway: Boolean(edge.oneway),
      highwayType: edge.highwayType,
      geometry: edge.geometry.coordinates.map(([lon, lat]) => ({ lat, lon })),
    }));

    return {
      profileApplied: {
        travelMode: dto.travelMode,
        isReducedMobility: dto.isReducedMobility,
        radiusMeters: hasCenter && !hasRing ? radiusMeters : undefined,
        ringMin: hasCenter ? ringMin : undefined,
        ringMax: hasCenter ? ringMax : undefined,
      },
      nodes: nodeRows,
      edges: mappedEdges,
    };
  }
}
