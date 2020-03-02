module Data

using HTTP, JSON3
using ..MangroveBase: RatingInfo

function rating(review)
  RatingInfo(review[:payload][:sub], review[:kid]) =>
    round(Int, (review[:payload][:rating] + 25)/25)
end

current_mangrove_data() = HTTP.get("https://api.mangrove.reviews/reviews").body |> JSON3.read

function current_mangrove_ratings()
  reviews = current_mangrove_data()[:reviews]
  Dict(rating(r) for r in reviews if haskey(r[:payload], :rating))
end

end