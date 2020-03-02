module Model

using Gen
using ..MangroveBase: RatingInfo, Rating, RATINGS
include("models_base.jl")

@dist quality() = uniform_discrete(1, RATINGS)

@gen function mangrove_model(subjects::Set{String}, reviewers::Set{String})
  for sub in subjects
    true_quality = @trace(quality(), (:quality, sub))
    for kid in subset(reviewers)
      @trace(
        uniform_discrete(true_quality, true_quality),
        RatingInfo(sub, kid) => :rating
      )
    end
  end
end

end