module MangroveBase

using Statistics
import Base.hash, Statistics.mean

Sub = String
Kid = String
struct RatingInfo
  sub::Sub
  kid::Kid
end
hash(info::RatingInfo) = hash(info.sub, hash(info.kid))

subs(infos::AbstractSet{RatingInfo}) = Set(info.sub for info in infos)
kids(infos::AbstractSet{RatingInfo}) = Set(info.kid for info in infos)
subs(infos::AbstractDict{RatingInfo, T}) where T = subs(keys(infos))
kids(infos::AbstractDict{RatingInfo, T}) where T = kids(keys(infos))

RATINGS = 5
Rating = Int
check_rating(rating::Rating) = @assert(1 <= rating <= RATINGS)

normalize(rating::Real) = (rating + 0.5) / 101

MangroveData = Dict{RatingInfo, Rating}
generate_data(subs::Int, ratings::Int)::MangroveData =
  Dict(
    RatingInfo(string(i % subs), string(i % ratings)) => i % subs % 100
    for i in 1:ratings
  )

function mean(ratings::MangroveData)::Dict{Sub, Rating}
  acc = Dict()
  for (info, r) in ratings
    push!(get!(acc, info.sub, []), r)
  end
  out = Dict()
  for (sub, v) in acc
    out[sub] = mean(v)
  end
  out
end

end