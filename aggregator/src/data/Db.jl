module Db

using LibPQ, Tables, DotEnv
using ..MangroveBase: ReviewInfo, ReviewContent, Reviews

DotEnv.config(path = "../.env")
const ENV_CONN = ENV["MANGROVE_DATABASE"]

function mangrove_reviews(conn_string::String = ENV_CONN)::Reviews
    conn = LibPQ.Connection(conn_string)
    result = execute(conn, "SELECT * FROM reviews")
    data = columntable(result)
    close(conn)
    Dict(
        ReviewInfo(row.sub, row.kid) => ReviewContent(row.rating, row.opinion)
        for row in Tables.rows(data) if !ismissing(row.rating)
    )
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