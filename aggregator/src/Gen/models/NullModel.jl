module Model

using Gen
using ..MangroveBase: ReviewInfo, Rating, RATINGS

@gen function subset(items::Vector{String})::Vector
  filter(item -> @trace(bernoulli(0.5), item), items)
end

@dist rating() = uniform_discrete(1, RATINGS)

@gen function mangrove_model(subjects::Set{String}, reviewers::Set{String})
  for sub in subjects
    @trace(rating(), :quality => sub)
    for kid in @trace(subset(collect(reviewers)), :selected => sub)
      @trace(rating(), ReviewInfo(sub, kid) => :rating)
    end
  end
end

end