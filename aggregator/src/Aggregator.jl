module Aggregator

# Base Mangrove types and conversions.
include("MangroveBase.jl")
using .MangroveBase: ReviewInfo, normalize, generate_data, convert, mean, hash
export ReviewInfo, normalize, generate_data

# Statistical model and inference.
include("Model.jl")
using .Model: mangrove_model, get_chains, subs, qualities
export mangrove_model, get_chains, subs, qualities

# Mangrove API access.
include("data/Api.jl")
# Mangrove DB reading and writing.
include("data/Db.jl")

# Script to be ran periodically to compute statistics and store them.
include("Job.jl")
using .Job: store_inferred
export store_inferred

export convert, hash, mean

end
