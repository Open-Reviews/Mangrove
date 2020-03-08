@gen function subset(items::Vector)::Vector
  filter(item -> @trace(bernoulli(0.5), (:selected, item[1])), items)
end