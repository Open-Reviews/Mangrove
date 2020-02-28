using Aggregator, Gen

println("Running inference...")

check_rating(rating::Number) = @assert(1 <= rating <= RATINGS)

Ratings = Dict{Tuple{String, String}, Float64}
function do_inference(
    model::DynamicDSLFunction,
    ratings::Ratings,
    amount_of_computation::Int
  )
  observations = Gen.choicemap()
  for (k, v) in ratings
    check_rating(v)
    observations[k => :rating] = v
  end
  
  # Call importance_resampling to obtain a likely trace consistent
  # with our observations.
  (trace, _) = Gen.importance_resampling(model, (), observations, amount_of_computation)
  return trace
end

biased = "1"
regular = "2"

data = Dict([[(string(o), biased) => 1. for o in 1:3]; [(string(o), regular) => o for o in 1:5]])
trace = do_inference(reviews, data, 10000)

trace |> get_choices |> println

println("Did detect biased reviewer: ", trace[(:bias, biased)])
println("Did detect regular reviewer: ", trace[(:bias, regular)])

#trace |> to_array |> println