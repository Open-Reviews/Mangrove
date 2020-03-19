module Job

using ..Db: ENV_CONN, mangrove_reviews, DbInput, insert
using ..Model: get_chains, subs, qualities, kids, neutralities
import Turing.mean

function store_inferred(conn_string::String = ENV_CONN)
    chains = conn_string |> mangrove_reviews |> get_chains
    sub_qualities = chains[:qualities] |> mean
    kid_neutralities = chains[:biases] |> mean
    input = DbInput(
        subs(sub_qualities),
        qualities(sub_qualities),
        kids(kid_neutralities),
        neutralities(kid_neutralities)
    )
    insert(conn_string, input)
end

end