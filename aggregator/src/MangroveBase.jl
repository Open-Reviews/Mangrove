module MangroveBase

using Statistics
import Base.convert, Base.hash, Statistics.mean

Sub = String
Kid = String
struct ReviewInfo
  sub::Sub
  kid::Kid
end
hash(info::ReviewInfo) = hash(info.sub, hash(info.kid))

struct ReviewContent
  rating::Int
  opinion::Union{Missing, String}
end
normalize(rating::Int)::Float64 = (rating + 0.5) / 101

"Normalized version of `ReviewContent`"
ReviewSummary = Tuple{Float64, Bool}
rating(s::ReviewSummary) = s[1]

convert(::Type{ReviewSummary}, c::ReviewContent) =
  (normalize(c.rating), !ismissing(c.opinion))

Reviews = Dict{ReviewInfo, ReviewContent}
ReviewsSummary = Dict{ReviewInfo, ReviewSummary}

convert(::Type{ReviewsSummary}, r::Reviews) =
  Dict(i => convert(ReviewSummary, c) for (i, c) in r)

subs(infos::AbstractSet{ReviewInfo}) = Set(info.sub for info in infos)
kids(infos::AbstractSet{ReviewInfo}) = Set(info.kid for info in infos)
subs(infos::AbstractDict{ReviewInfo, T}) where T = subs(keys(infos))
kids(infos::AbstractDict{ReviewInfo, T}) where T = kids(keys(infos))

RATINGS = 100
check_rating(rating::Int) = @assert(0 <= rating <= RATINGS)

generate_data(subs::Int, ratings::Int)::Reviews =
  Dict(
    ReviewInfo(string(i % subs), string(i % 100)) =>
      ReviewContent((i % subs % 11) * 10, missing)
    for i in 0:ratings - 1
  )

function mean(ratings::ReviewsSummary)::Dict{Sub, Int}
  acc = Dict()
  for (info, s) in ratings
    push!(get!(acc, info.sub, []), rating(s))
  end
  out = Dict()
  for (sub, v) in acc
    out[sub] = mean(v)
  end
  out
end

mean(rs::Base.ValueIterator{ReviewsSummary}) = mean(rating(s) for s in rs)

end