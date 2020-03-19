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

struct DbInput
    subs::Vector{String}
    qualities::Vector{Int16}
    kids::Vector{String}
    neutralities::Vector{Float32}
end

function insert(conn_string::String, in::DbInput)
    conn = LibPQ.Connection(conn_string)
    execute(conn, "BEGIN;")
    LibPQ.load!(
        (sub = in.subs, quality = in.qualities),
        conn,
        """
        INSERT INTO subjects (sub, quality) VALUES (\$1, \$2)
        ON CONFLICT (sub) DO UPDATE
            SET sub = excluded.sub,
                quality = excluded.quality;
        """,
    )
    LibPQ.load!(
        (pem = in.kids, neutrality = in.neutralities),
        conn,
        """
        INSERT INTO reviewers (pem, neutrality) VALUES (\$1, \$2)
        ON CONFLICT (pem) DO UPDATE
            SET pem = excluded.pem,
                neutrality = excluded.neutrality;
        """,
    )
    execute(conn, "COMMIT;")
    close(conn)
end

end