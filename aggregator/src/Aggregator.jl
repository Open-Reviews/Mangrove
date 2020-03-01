module Aggregator

include("MangroveBase.jl")
using .MangroveBase: RatingInfo, Rating, mean, hash
export RatingInfo, Rating, mean

include("Data.jl")
using .Data: current_mangrove_data, current_mangrove_ratings
export current_mangrove_data, current_mangrove_ratings

include("models/HonestModel.jl")
using .Model: RATINGS, mangrove_model
export RATINGS, mangrove_model

include("Inference.jl")
using .Inference: get_trace, qualities, mean_l2
export get_trace, qualities, mean_l2

export hash

end
