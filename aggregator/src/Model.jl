module Model

using Turing
using ..MangroveBase: ReviewsSummary, Reviews, kids, subs, normalize
import ..MangroveBase.subs, ..MangroveBase.kids

"Construct a `Beta` distribution with given `mean` and spikiness given by `certainty`."
MeanBeta(mean::Real, certainty::Real = 3) = Beta(certainty * mean, certainty * (1 - mean))

# Generative Bayesian model representing the Mangrove Reviews data.
@model mangrove_model(data, typical_rating) = begin
    # Assume that each subject has a fundamental quality associated with it.
    # Extreme qualities are not as likely as moderate ones.
    qualities = Dict()
    for sub in subs(data)
        qualities[sub] ~ MeanBeta(typical_rating)
    end
    # Assume that each reviewer is either neutral (0) or biased (1).
    biases = Dict()
    for kid in kids(data)
        biases[kid] ~ Bernoulli(0.3)
    end
    # Observe the ratings from the dataset, which depend on quality and bias.
    for info in keys(data)
      if biases[info.kid] == 0
            # Neutral reviewer leaves a review which reflects the quality.
            data[info][1] ~ MeanBeta(qualities[info.sub])
        else
            # Biased reviewers are mostly negative and pay not attention to actual quality.
            data[info][1] ~ Beta(0.04, 0.08)
        end
    end
end

"Normalize the data and run inference using the model."
function get_chains(raw_data::Reviews)::Chains
    data = convert(ReviewsSummary, raw_data)
    typical_rating = mean(values(data))
    sampler = PG(500)
    sample(mangrove_model(data, typical_rating), sampler, 100)
end

# Extract useful data from the resulting MarkovChains: `mean(chn::Chains)`

subs(qualities_mean::ChainDataFrame)::Vector{String} =
  [match(r"qualities\[(.+)\]", p)[1] for p in qualities_mean[:, :parameters]]
qualities(qualities_mean::ChainDataFrame)::Vector{Int16} =
  [round(Int16, m*100) for m in qualities_mean[:, :mean]]

kids(biases_mean::ChainDataFrame)::Vector{String} =
  [match(r"biases\[(.+)\]", p)[1] for p in biases_mean[:, :parameters]]
neutralities(biases_mean::ChainDataFrame)::Vector{Float32} =
  [1 - m for m in biases_mean[:, :mean]]

end
