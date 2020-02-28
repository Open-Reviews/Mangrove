module Aggregator

include("Data.jl")
using .Data: current_mangrove_data, current_mangrove_ratings
export current_mangrove_data, current_mangrove_ratings

include("Model.jl")
using .Model: RATINGS, reviews
export RATINGS, reviews

end
