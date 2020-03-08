module Inference

using Gen
using ..MangroveBase: RatingInfo, Rating, Sub, mean, subs, kids

function get_trace(
    model::DynamicDSLFunction,
    ratings::Dict{RatingInfo, Rating},
    amount_of_computation::Int
  )::Gen.Trace
  println("Running inference...")
  observations = Gen.choicemap()
  subjects = subs(ratings)
  reviewers = kids(ratings)
  for sub in subjects
    for kid in reviewers
      observations[:selected => sub => kid] = false
    end
  end
  for (k, v) in ratings
    observations[k => :rating] = v
    observations[:selected => k.sub => k.kid] = true
  end

  # Call importance_resampling to obtain a likely trace consistent
  # with our observations.
  (trace, _) = Gen.importance_resampling(
    model,
    (subjects, reviewers),
    observations,
    amount_of_computation
  )
  return trace
end

function qualities(t::Gen.Trace)::Dict{Sub, Rating}
  Dict(sub => t[:quality => sub] for sub in get_args(t)[1])
end

function mean_l2(data::Dict{RatingInfo, Rating}, trace::Gen.Trace)::Real
  data_mean = mean(data)
  model_quality = qualities(trace)
  sum((data_mean[sub] - model_quality[sub])^2 for sub in subs(data)) / length(data)
end

end