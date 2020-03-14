module Api

using HTTP, JSON3
using ..MangroveBase: RatingInfo, MangroveData

all_data() = HTTP.get("https://api.mangrove.reviews/reviews").body |> JSON3.read

function mangrove_ratings()::MangroveData
  reviews = all_data()[:reviews]
  Dict(
    RatingInfo(r[:payload][:sub], r[:kid]) => r[:payload][:rating]
    for r in reviews if haskey(r[:payload], :rating)
  )
end

end