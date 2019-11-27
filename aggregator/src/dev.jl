using Gen

RATINGS = 5

@dist object_quality() = uniform_discrete(1,RATINGS)

@enum Bias neutral owner

@dist reviewer_bias() = Bias(categorical([0.8, 0.2]) - 1)

@gen function triangle_categorical(max, peak, slope)
  # A bit asymmetric, good enough.
  raw = [[x^(1/slope) for x in 1:peak]; [((-x)^(1/slope) * peak - 1) / (max - peak) for x in peak - max:-1]]
  @trace(categorical(raw ./ sum(raw)), :rating)
end

@gen function rating(quality, bias)::Float64
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

@gen function subset(items::Vector)::Vector
  filter(_ -> bernoulli(0.9), items)
end

@gen function reviews()
  objects = [@trace(object_quality(), (:quality, i)) for i in 1:10]
  reviewers = [@trace(reviewer_bias(), (:bias, i)) for i in 1:10]
  for (i, object) in enumerate(objects)
    for (j, reviewer) in enumerate(subset(reviewers))
      @trace(rating(object, reviewer), (i, j))
    end
  end
end

check_rating(rating::Number) = @assert(1 <= rating <= RATINGS)

function do_inference(model, ratings, amount_of_computation)
  observations = Gen.choicemap()
  for (k, v) in ratings
    check_rating(v)
    observations[k => :rating] = v
  end
  
  # Call importance_resampling to obtain a likely trace consistent
  # with our observations.
  (trace, _) = Gen.importance_resampling(model, (), observations, amount_of_computation)
  return trace
end

biased = 1
regular = 2

trace = do_inference(reviews, [[(o, biased) => 1. for o in 1:3]; [(o, regular) => o for o in 1:5]], 10000)

trace |> get_choices |> println

println("Did detect biased reviewer: ", trace[(:bias, biased)])
println("Did detect regular reviewer: ", trace[(:bias, regular)])

#trace |> to_array |> println