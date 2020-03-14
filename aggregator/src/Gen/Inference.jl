module Inference

using Gen
using ..MangroveBase: MangroveData, Rating, Sub, mean, subs, kids
import Gen.get_traces

function get_traces(
    model::DynamicDSLFunction,
    ratings::MangroveData,
    amount_of_computation::Int
  )::Vector{Gen.Trace}
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

  trace, = Gen.importance_resampling(
    model,
    (subjects, reviewers),
    observations,
    100
  )

  traces = Gen.Trace[]

  for i in 1:amount_of_computation
    if i%(amount_of_computation / 20) == 0
      println(
        "MH iteration ", i, " out of ", amount_of_computation,
        " (", round(Int, i/amount_of_computation*100), "%)"
      )
    end
    trace, = mh(trace, select(:quality))
    push!(traces, trace)
  end

  return traces
end

function qualities(t::Gen.Trace)::Dict{Sub, Rating}
  Dict(sub => t[:quality => sub] for sub in get_args(t)[1])
end

function mean_l2(data::MangroveData, traces::Vector{Gen.Trace})::Real
    subjects = subs(data)
  data_mean = mean(data)
  trace_qualities = (qualities(trace) for trace in traces)
  sum((data_mean[sub] - mean(qualities[sub] for qualities in trace_qualities))^2 for sub in subjects) / length(subjects)
end

end