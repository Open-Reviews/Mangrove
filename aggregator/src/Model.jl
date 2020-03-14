module Model

using Turing
using ..MangroveBase: MangroveData, RatingInfo, subs, normalize
import ..MangroveBase.subs

MeanBeta(mean::Real, certainty::Real) = Beta(certainty, certainty * (1 - mean) / mean)

@model mangrove_model(data, typical_rating) = begin
    qualities = Dict()
    for sub in subs(data)
        qualities[sub] ~ MeanBeta(typical_rating, 2)
    end
    for info in keys(data)
        data[info] ~ MeanBeta(qualities[info.sub], 1)
    end
end

function get_chains(raw_data::MangroveData)::Chains
    normal_data = Dict{RatingInfo, Float64}()
    for key in keys(raw_data)
        normal_data[key] = normalize(raw_data[key])
    end
    typical_rating = mean(values(normal_data))
    sample(mangrove_model(normal_data, typical_rating), HMC(0.1, 5), 1000)
end

subs(chains_mean::ChainDataFrame)::Vector{String} =
  [match(r"qualities\[(.+)\]", p)[1] for p in chains_mean[:, :parameters]]

qualities(chains_mean::ChainDataFrame)::Vector{Int16} =
  [round(Int16, m*100) for m in chains_mean[:, :mean]]

end