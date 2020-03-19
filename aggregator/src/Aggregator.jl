module Aggregator

include("MangroveBase.jl")
using .MangroveBase: ReviewInfo, normalize, generate_data, convert, mean, hash
export ReviewInfo, normalize, generate_data

include("Model.jl")
using .Model: mangrove_model, get_chains, subs, qualities
export get_chains, subs, qualities

include("data/Api.jl")
include("data/Db.jl")

include("Job.jl")
using .Job: store_qualities
export store_qualities

export convert, hash, mean

end
