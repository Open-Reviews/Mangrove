using Aggregator, Gen

biased = "1"
regular = "2"

data = [[(string(o), biased) => 1. for o in 1:3]; [(string(o), regular) => o for o in 1:5]]
trace = get_trace(mangrove_model, data, 10000)

trace |> get_choices |> println

println("Did detect biased reviewer: ", trace[(:bias, biased)])
println("Did detect regular reviewer: ", trace[(:bias, regular)])

#trace |> to_array |> println

data = Dict(RatingInfo(string(i), string(i)) => i for i in 1:5)