module Job

using ..Db: ENV_CONN, mangrove_reviews, insert
using ..Model: get_chains, subs, qualities
import Turing.mean

function store_inferred(conn_string::String = ENV_CONN)
    chains = conn_string |> mangrove_reviews |> get_chains
    qualities = chains[:qualities] |> mean
    insert(conn_string, subs(qualities), qualities(qualities))
end

end