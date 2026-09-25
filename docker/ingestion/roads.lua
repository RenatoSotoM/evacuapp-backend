local roads = osm2pgsql.define_way_table('osm_roads', {
    { column = 'highway_type', type = 'text' },
    { column = 'oneway', type = 'bool' },
    { column = 'accessible', type = 'bool' },
    { column = 'geom', type = 'linestring', projection = 4326 }
})

function osm2pgsql.process_way(object)
    local highway = object.tags.highway
    if not highway then
        return
    end

    local oneway = object.tags.oneway == 'yes'
        or object.tags.oneway == '1'
        or object.tags.oneway == 'true'

    local inaccessible = object.tags.access == 'no'
        or object.tags.foot == 'no'
        or object.tags.wheelchair == 'no'
        or highway == 'steps'

    roads:insert({
        highway_type = highway,
        oneway = oneway,
        accessible = not inaccessible,
        geom = object:as_linestring()
    })
end
