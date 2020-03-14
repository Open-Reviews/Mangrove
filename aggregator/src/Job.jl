module Job

using ..Db: ENV_CONN, mangrove_ratings, insert
using ..Model: get_chains, subs, qualities
import Turing.mean

function store_qualities(conn_string::String = ENV_CONN)
    result = conn_string |> mangrove_ratings |> get_chains |> mean
    insert(conn_string, subs(result), qualities(result))
end

end