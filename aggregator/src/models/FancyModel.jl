module Model

using Gen
using ..MangroveBase: RatingInfo, Rating, RATINGS
include("models_base.jl")

@dist subject_quality() = uniform_discrete(1, RATINGS)

@enum Bias neutral owner

@dist reviewer_bias()::Bias = Bias(categorical([0.8, 0.2]) - 1)

@gen function triangle_categorical(max::Int, peak::Int, slope)::Int
  # A bit asymmetric, good enough.
  raw = [[x^(1/slope) for x in 1:peak]; [((-x)^(1/slope) * peak - 1) / (max - peak) for x in peak - max:-1]]
  @trace(categorical(raw ./ sum(raw)), :rating)
end

@gen function rating(quality, bias)::Rating
  if bias == neutral
    @trace(triangle_categorical(RATINGS, quality, 0.3))
  elseif bias == owner
    if bernoulli(0.3)
      # This place is his, rate it high.
      @trace(triangle_categorical(RATINGS, RATINGS, 4))
    else
      # Someone else's place, rate it low.
      @trace(triangle_categorical(RATINGS, 1, 0.2))
    end
  end
end

@gen function mangrove_model(subjects::Set{String}, reviewers::Set{String})
  qualities = (sub => @trace(subject_quality(), (:quality, sub)) for sub in subjects)
  biases = [id => @trace(reviewer_bias(), (:bias, id)) for id in reviewers]
  for (sub, quality) in qualities
    for (id, bias) in subset(biases)
      @trace(rating(quality, bias), RatingInfo(sub, id))
    end
  end
end

end