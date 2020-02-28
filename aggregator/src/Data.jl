module Data

using HTTP, JSON3

rating(review) = (review[:payload][:sub], review[:kid]) => review[:payload][:rating]

current_mangrove_data() = HTTP.get("https://api.mangrove.reviews/reviews").body |> JSON3.read

function current_mangrove_ratings()
  reviews = current_mangrove_data()[:reviews]
  [rating(r) for r in reviews if haskey(r[:payload], :rating)] 
end

end