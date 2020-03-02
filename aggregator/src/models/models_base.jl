@gen function subset(items::Vector)::Vector
  filter(_ -> bernoulli(0.5), items)
end