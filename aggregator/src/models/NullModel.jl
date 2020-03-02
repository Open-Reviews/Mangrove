module Model

using Gen
using ..MangroveBase: RatingInfo, Rating, RATINGS
include("models_base.jl")

@dist rating() = uniform_discrete(1, RATINGS)

@gen function mangrove_model(subjects::Set{String}, reviewers::Set{String})
  for sub in subjects
    @trace(rating(), (:quality, sub))
    for kid in subset(reviewers)
      @trace(rating(), RatingInfo(sub, kid) => :rating)
    end
  end
end

end