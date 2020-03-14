module Aggregator

include("MangroveBase.jl")
using .MangroveBase: RatingInfo, normalize, generate_data, mean, hash
export RatingInfo, normalize, generate_data

include("Model.jl")
using .Model: mangrove_model, get_chains, subs, qualities
export get_chains, subs, qualities

include("data/Api.jl")
include("data/Db.jl")

include("Job.jl")
using .Job: store_qualities
export store_qualities

export hash, mean

end
