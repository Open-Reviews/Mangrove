module Api

using HTTP, JSON3
using ..MangroveBase: ReviewInfo, ReviewContent, Reviews

"Fetch all possible data from the Mangrove Api."
all_data() = HTTP.get("https://api.mangrove.reviews/reviews?issuers=true&maresi_subjects=true").body |> JSON3.read

"Extract internal datastructures from the Api output."
function extract(all::JSON3.Object)::Reviews
  reviews = all[:reviews]
  Dict(
    ReviewInfo(r[:payload][:sub], r[:kid]) =>
      ReviewContent(r[:payload][:rating], get(r[:payload], :opinion, missing))
    for r in reviews if haskey(r[:payload], :rating)
  )
end

"Fetch and extract data."
function mangrove_reviews()::Reviews
  extract(all_data())
end

end
