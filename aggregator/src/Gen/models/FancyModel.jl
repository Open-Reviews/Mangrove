module Model

using Gen
using ..MangroveBase: RatingInfo, Rating, RATINGS

@gen function subset(items::Vector)::Vector
  filter(item -> @trace(bernoulli(0.5), item[1]), items)
end

@dist subject_quality() = uniform_discrete(1, RATINGS)

@enum Bias neutral owner

@dist reviewer_bias()::Bias = Bias(categorical([0.8, 0.2]) - 1)

@gen function triangle_categorical(peak::Real)::Float64
  raw = [(5 - abs(x - peak)) for x in 1:5]
  @trace(categorical(raw ./ sum(raw)), :rating)
end

@gen function rating(quality, bias)::Rating
  if bias == neutral
    @trace(triangle_categorical(quality))
  elseif bias == owner
    if bernoulli(0.3)
      # This place is his, rate it high.
      @trace(triangle_categorical(RATINGS))
    else
      # Someone else's place, rate it low.
      @trace(triangle_categorical(1))
    end
  end
end

@gen function mangrove_model(subjects::Set{String}, reviewers::Set{String})
  biases = [id => @trace(reviewer_bias(), :bias => id) for id in reviewers]
  for sub in subjects
    true_quality = @trace(subject_quality(), :quality => sub)
    for (id, bias) in @trace(subset(biases), :selected => sub)
      @trace(rating(true_quality, bias), RatingInfo(sub, id))
    end
  end
end

end