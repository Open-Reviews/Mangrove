module Db

using LibPQ, Tables, DotEnv
using ..MangroveBase: RatingInfo, MangroveData

DotEnv.config(path = "../.env")
const ENV_CONN = ENV["MANGROVE_DATABASE"]

function mangrove_ratings(conn_string::String = ENV_CONN)::MangroveData
    conn = LibPQ.Connection(conn_string)
    result = execute(conn, "SELECT * FROM reviews")
    data = columntable(result)
    close(conn)
    Dict(RatingInfo(row.sub, row.kid) => row.rating for row in Tables.rows(data))
end

function insert(conn_string::String, subs::Vector{String}, qualities::Vector{Int16})
    conn = LibPQ.Connection(conn_string)
    execute(conn, "BEGIN;")
    LibPQ.load!(
        (sub = subs, quality = qualities),
        conn,
        """
        INSERT INTO subjects (sub, quality) VALUES (\$1, \$2)
        ON CONFLICT (sub) DO UPDATE
            SET sub = excluded.sub,
                quality = excluded.quality;
        """,
    )
    execute(conn, "COMMIT;")
    close(conn)
end

end