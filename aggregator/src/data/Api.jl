module Api

using HTTP, JSON3
using ..MangroveBase: ReviewInfo, ReviewContent, Reviews

all_data() = HTTP.get("https://api.mangrove.reviews/reviews").body |> JSON3.read

function mangrove_reviews()::Reviews
  reviews = all_data()[:reviews]
  Dict(
    ReviewInfo(r[:payload][:sub], r[:kid]) =>
      ReviewContent(r[:payload][:rating], get(r[:payload], :opinion, missing))
    for r in reviews if haskey(r[:payload], :rating)
  )
end

end