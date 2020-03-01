module Model

using Gen
using ..MangroveBase: RatingInfo, Rating, RATINGS

@dist quality() = uniform_discrete(1, RATINGS)

@gen function subset(items::Vector)::Vector
  filter(_ -> bernoulli(0.5), items)
end

@gen function mangrove_model(subjects::Set{String}, reviewers::Set{String})
  for sub in subjects
    true_quality = @trace(quality(), (:quality, sub))
    for kid in subset(reviewers)
      @trace(true_quality, RatingInfo(sub, kid) => :rating)
    end
  end
end

end