module Model

using Gen
using ..MangroveBase: RatingInfo, Rating, RATINGS

@gen function subset(items::Vector{String})::Vector
  filter(item -> @trace(bernoulli(0.5), item), items)
end

@dist quality() = uniform_discrete(1, RATINGS)

@gen function triangle_categorical(peak::Real)::Float64
  raw = [(5 - abs(x - peak)) for x in 1:5]
  @trace(categorical(raw ./ sum(raw)), :rating)
end

@gen function mangrove_model(subjects::Set{String}, reviewers::Set{String})
  for sub in subjects
    true_quality = @trace(quality(), :quality => sub)
    for kid in @trace(subset(collect(reviewers)), :selected => sub)
      @trace(
        triangle_categorical(true_quality),
        RatingInfo(sub, kid)
      )
    end
  end
end

end