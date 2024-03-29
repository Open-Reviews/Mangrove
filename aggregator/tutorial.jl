### A Pluto.jl notebook ###
# v0.12.20

using Markdown
using InteractiveUtils

# This Pluto notebook uses @bind for interactivity. When running this notebook outside of Pluto, the following 'mock version' of @bind gives bound variables a default value (instead of an error).
macro bind(def, element)
    quote
        local el = $(esc(element))
        global $(esc(def)) = Core.applicable(Base.get, el) ? Base.get(el) : missing
        el
    end
end

# ╔═╡ 2fcbf600-19e9-11eb-3f4e-812a4a557c20
using Revise, PlutoUI, Aggregator, Aggregator.Api, Plots, StatsBase

# ╔═╡ eab20564-19fc-11eb-039f-dde6b6ef710a
begin
	using Aggregator.MangroveBase: ReviewsSummary
	using Aggregator.Model: MeanBeta
	using Turing, MCMCChains, StatsPlots
end

# ╔═╡ 9a68f5a6-33b8-11eb-3ca1-6f6ae024c66a
using Aggregator.Model: neutralities

# ╔═╡ 02ba1bfa-824f-11eb-26d4-4153ef9e7ec7
using Dates

# ╔═╡ 5e865152-19f3-11eb-0434-7b4fe9bde74c
md"""
# Looking around
## Fetch some data via the open API

See [documentation](https://docs.mangrove.reviews), to try it out directly.
"""

# ╔═╡ e6055cee-19ea-11eb-0a18-dd5847a9b78b
all_data = Api.all_data();

# ╔═╡ 6e1573f8-1e00-11eb-2c32-37d99db3a81d
all_data

# ╔═╡ 52f702b4-19f3-11eb-12db-bbf15e67ac47
md"## Define useful filters"

# ╔═╡ 4f4d918e-19ec-11eb-3b85-53cdeccf6c6c
begin
	reviews = all_data[:reviews]
	issuers = all_data[:issuers]
	maresi_subjects = all_data[:maresi_subjects]
	# Extract payload for each review.
	payloads = [r[:payload] for r in reviews]
end;

# ╔═╡ 4aff9e48-19ff-11eb-2e55-5f742ab32834
md"## View individual data points to understand the data"

# ╔═╡ 09950bc8-19f0-11eb-25cd-cbdad6720d00
md"We have **$(length(reviews))** reviews available, to browse through their payloads you can use the slider:"

# ╔═╡ 3a5fa0c4-19eb-11eb-0d57-8b3ae66cc2cb
@bind i Slider(1:length(payloads); show_value=true)

# ╔═╡ fd4eb326-19ea-11eb-064e-9765cb805381
payloads[i]

# ╔═╡ 0cc6d9a2-19ff-11eb-3151-edf0fd984a33
md"Images from selected review:"

# ╔═╡ ee090a7c-19f8-11eb-3b24-4bad4154fb47
begin
	image_urls = [i[:src] for i in get(payloads[i], :images, [])]
	Markdown.parse(join(["![]($image_url)" for image_url in image_urls]))
end

# ╔═╡ 623c0214-19f4-11eb-19f8-25bd8b4759c3
md"## Count properties to get global view"

# ╔═╡ b07ed06c-19f1-11eb-1e0d-f9cc921936f9
bar(countmap([r[:scheme] for r in reviews]); label="Number of reviews with given scheme")

# ╔═╡ afaa3110-19ef-11eb-1300-4f0997354a02
histogram([p[:rating]/25+1 for p in payloads if haskey(p, :rating)]; label="Number of reviews with given rating", legend=:left)

# ╔═╡ d88e9f14-19f2-11eb-25cb-515474ef1d7e
pie(countmap([haskey(p, :opinion) ? "Includes text" : "Only rating" for p in payloads]))

# ╔═╡ e37de39a-19fb-11eb-3dc7-519496db6281
md"# Aggregation algorithm"

# ╔═╡ aa351f6c-1a01-11eb-112a-91098dfc0d9a
md"""
Takes the reviews and gives us information about:
- quality of each subject
- neutrality of each reviewer
"""

# ╔═╡ 7bd88b90-19fc-11eb-284c-3bbaac7bfbd4
data = convert(ReviewsSummary, Api.extract(all_data));

# ╔═╡ 4d525f4c-1a01-11eb-1bf5-93d9f75f60c1
md"## Rating hypothesis/prior"

# ╔═╡ 13784e4c-1a00-11eb-2cde-75e886262ca1
@bind typical_rating Slider(0.1:0.1:0.9; default=0.5, show_value=true)

# ╔═╡ ceb59220-19fc-11eb-0f3c-13401192e6e5
rating_prior = MeanBeta(typical_rating);

# ╔═╡ bde4519e-19fd-11eb-24e2-af7f11145287
rating_sample = rand(rating_prior)

# ╔═╡ 0560381c-19fe-11eb-2687-03de0bd3f1f7
stars(raw_rating) = round(Int, raw_rating * 4) + 1;

# ╔═╡ a310a412-19fd-11eb-15ea-9f628cb434ea
stars(rating_sample)

# ╔═╡ 6d56a51c-1a00-11eb-11e4-a7c3f78de140
md"### Prior distribution of ratings"

# ╔═╡ 67f9ac00-1a84-11eb-1c54-7f71af6356e1
scatter(rand(rating_prior, 100); label="Sequence of draws from rating prior", legend=:right)

# ╔═╡ 7a9aa156-19fd-11eb-089b-1f1e9dc68932
histogram(map(stars, rand(rating_prior, 1000)); label="Number of reviews with given rating", legend=:left)

# ╔═╡ 80cba09a-1a01-11eb-0eca-474971cbd4d1
md"## Data driven prior"

# ╔═╡ 7bfb2c32-1a02-11eb-0a8c-7f0b9ff5675f
collect(data)[i]

# ╔═╡ 15852576-19fd-11eb-227c-97d39d2f8d0e
begin
	typical_rating_ = round(mean(values(data)), digits=2)
	md"Average rating value: **$(typical_rating_)**"
end

# ╔═╡ 4be0bac4-1a07-11eb-31c1-3d175b6fe365
md"## Monte Carlo inference"

# ╔═╡ 05475720-1a03-11eb-3c18-69b65f2ad768
chains = sample(mangrove_model(data, typical_rating_), PG(100), 100);

# ╔═╡ 932f8bfc-1a03-11eb-031b-3944a2157475
plot(chains; colordim=:parameter)

# ╔═╡ 90c60698-1a06-11eb-19ac-77b8fcd23c46
begin
	mean_qualities = mean(group(chains, :qualities))
	subjects = Dict(zip(subs(mean_qualities), qualities(mean_qualities)))
	mean_biases = mean(group(chains, :biases))
	reviewers = Dict(zip(Aggregator.Model.kids(mean_biases), Aggregator.Model.neutralities(mean_biases)))
end;

# ╔═╡ a12cb3c4-1a10-11eb-1494-199c763f04c1
subjects |> values |> collect |> histogram

# ╔═╡ 6ce62da8-1a11-11eb-22f6-573137e77293
worst_reviewer = collect(keys(reviewers))[argmin(collect(values(reviewers)))]

# ╔═╡ 8b3ad6c8-1a11-11eb-1f6a-077185c89857
[r[:payload] for r in reviews if r[:kid] == worst_reviewer]

# ╔═╡ 0609d5fa-19f1-11eb-13d9-25c772bc2a10
histogram(collect(values(reviewers)); label="Neutralities histogram", legend=:left)

# ╔═╡ c3f32ac6-1e06-11eb-0263-05927fbc8215
reviewers

# ╔═╡ d2ec9cf6-1e06-11eb-105a-edc6d5fbf2cc
subjects

# ╔═╡ d50c4ca0-1e08-11eb-29ba-cd06e4559d16
rand(Beta(0.04, 0.08), 10000) |> histogram

# ╔═╡ 8bf807d4-1e0a-11eb-2050-27bf41d7aa3e
rand(Beta(20, 1), 10000) |> histogram

# ╔═╡ 0adba460-1e0a-11eb-213d-09d963634bcd
rand(MeanBeta(0.8, 10), 10000) |> histogram

# ╔═╡ 81f061f4-33b9-11eb-179d-e78d8cb7e41e
plot(x -> pdf(MeanBeta(0.5, 2.), x), 0, 1)

# ╔═╡ 76768ae4-33ba-11eb-065f-2561fb2ea0fb
[rand(MeanBeta(0.73, 3))*rand(MeanBeta(0.5 / 101, 3)) for _ in 1:10000] |> mean

# ╔═╡ 98160576-33ba-11eb-3434-937ff3a831b6
issuers[Symbol("-----BEGIN PUBLIC KEY-----MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQs7EX2DHYSpif48XQBp3vjH4Df39kbqef7P5RkBRmDSQUffTW80BSuPM8rHjzSgehCy2VJHUPfG719PDKpUmMA==-----END PUBLIC KEY-----")]

# ╔═╡ cbbe7ec6-33d3-11eb-1e56-ed7b81097851
subjects["geo:47.557018,8.5930537?q=Burgstelle Hebelstein&u=30"]

# ╔═╡ e12fb6d8-33d3-11eb-1b74-6f0a7f437699
[p[:payload][:rating] for p in reviews if p[:kid] == "-----BEGIN PUBLIC KEY-----MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQs7EX2DHYSpif48XQBp3vjH4Df39kbqef7P5RkBRmDSQUffTW80BSuPM8rHjzSgehCy2VJHUPfG719PDKpUmMA==-----END PUBLIC KEY-----"]

# ╔═╡ 23a6f398-33d4-11eb-2659-7f2673bb9ab4
MeanBeta(0+0.5 / 101)

# ╔═╡ 8c958bc2-33d8-11eb-304c-71995153657b
reviews[1]

# ╔═╡ dcaee4ea-33d9-11eb-2bdb-056764479e43
Uniform() |> rand

# ╔═╡ 308f3126-824e-11eb-3ddc-4d4f19c31563
md"# Other analysis"

# ╔═╡ 4014f606-824e-11eb-0b60-f5f4cd5ab3b9
recent_reviews = sort(reviews; by=r->r.payload.iat)[end-20:end]

# ╔═╡ 064f208a-824f-11eb-2e59-89462a53247a
unix2datetime

# ╔═╡ 1901deac-824f-11eb-198f-d9395e51bd3f
[unix2datetime(r.payload.iat) for r in recent_reviews]

# ╔═╡ 677a3b14-8250-11eb-35db-cf6569b2f766
recent_reviews[1].kid

# ╔═╡ 73bd8d2c-8250-11eb-19f9-1f450441ba5b
issuers[recent_reviews[1].kid]

# ╔═╡ Cell order:
# ╠═2fcbf600-19e9-11eb-3f4e-812a4a557c20
# ╟─5e865152-19f3-11eb-0434-7b4fe9bde74c
# ╠═e6055cee-19ea-11eb-0a18-dd5847a9b78b
# ╠═6e1573f8-1e00-11eb-2c32-37d99db3a81d
# ╟─52f702b4-19f3-11eb-12db-bbf15e67ac47
# ╠═4f4d918e-19ec-11eb-3b85-53cdeccf6c6c
# ╟─4aff9e48-19ff-11eb-2e55-5f742ab32834
# ╟─09950bc8-19f0-11eb-25cd-cbdad6720d00
# ╟─3a5fa0c4-19eb-11eb-0d57-8b3ae66cc2cb
# ╟─fd4eb326-19ea-11eb-064e-9765cb805381
# ╟─0cc6d9a2-19ff-11eb-3151-edf0fd984a33
# ╠═ee090a7c-19f8-11eb-3b24-4bad4154fb47
# ╟─623c0214-19f4-11eb-19f8-25bd8b4759c3
# ╠═b07ed06c-19f1-11eb-1e0d-f9cc921936f9
# ╠═afaa3110-19ef-11eb-1300-4f0997354a02
# ╠═d88e9f14-19f2-11eb-25cb-515474ef1d7e
# ╟─e37de39a-19fb-11eb-3dc7-519496db6281
# ╟─aa351f6c-1a01-11eb-112a-91098dfc0d9a
# ╠═eab20564-19fc-11eb-039f-dde6b6ef710a
# ╠═7bd88b90-19fc-11eb-284c-3bbaac7bfbd4
# ╟─4d525f4c-1a01-11eb-1bf5-93d9f75f60c1
# ╟─13784e4c-1a00-11eb-2cde-75e886262ca1
# ╠═ceb59220-19fc-11eb-0f3c-13401192e6e5
# ╠═bde4519e-19fd-11eb-24e2-af7f11145287
# ╠═0560381c-19fe-11eb-2687-03de0bd3f1f7
# ╠═a310a412-19fd-11eb-15ea-9f628cb434ea
# ╟─6d56a51c-1a00-11eb-11e4-a7c3f78de140
# ╠═67f9ac00-1a84-11eb-1c54-7f71af6356e1
# ╠═7a9aa156-19fd-11eb-089b-1f1e9dc68932
# ╟─80cba09a-1a01-11eb-0eca-474971cbd4d1
# ╠═7bfb2c32-1a02-11eb-0a8c-7f0b9ff5675f
# ╟─15852576-19fd-11eb-227c-97d39d2f8d0e
# ╟─4be0bac4-1a07-11eb-31c1-3d175b6fe365
# ╠═05475720-1a03-11eb-3c18-69b65f2ad768
# ╠═932f8bfc-1a03-11eb-031b-3944a2157475
# ╟─90c60698-1a06-11eb-19ac-77b8fcd23c46
# ╠═a12cb3c4-1a10-11eb-1494-199c763f04c1
# ╠═6ce62da8-1a11-11eb-22f6-573137e77293
# ╠═8b3ad6c8-1a11-11eb-1f6a-077185c89857
# ╠═9a68f5a6-33b8-11eb-3ca1-6f6ae024c66a
# ╠═0609d5fa-19f1-11eb-13d9-25c772bc2a10
# ╠═c3f32ac6-1e06-11eb-0263-05927fbc8215
# ╠═d2ec9cf6-1e06-11eb-105a-edc6d5fbf2cc
# ╠═d50c4ca0-1e08-11eb-29ba-cd06e4559d16
# ╠═8bf807d4-1e0a-11eb-2050-27bf41d7aa3e
# ╠═0adba460-1e0a-11eb-213d-09d963634bcd
# ╠═81f061f4-33b9-11eb-179d-e78d8cb7e41e
# ╠═76768ae4-33ba-11eb-065f-2561fb2ea0fb
# ╠═98160576-33ba-11eb-3434-937ff3a831b6
# ╠═cbbe7ec6-33d3-11eb-1e56-ed7b81097851
# ╠═e12fb6d8-33d3-11eb-1b74-6f0a7f437699
# ╠═23a6f398-33d4-11eb-2659-7f2673bb9ab4
# ╠═8c958bc2-33d8-11eb-304c-71995153657b
# ╠═dcaee4ea-33d9-11eb-2bdb-056764479e43
# ╟─308f3126-824e-11eb-3ddc-4d4f19c31563
# ╠═4014f606-824e-11eb-0b60-f5f4cd5ab3b9
# ╠═02ba1bfa-824f-11eb-26d4-4153ef9e7ec7
# ╠═064f208a-824f-11eb-2e59-89462a53247a
# ╠═1901deac-824f-11eb-198f-d9395e51bd3f
# ╠═677a3b14-8250-11eb-35db-cf6569b2f766
# ╠═73bd8d2c-8250-11eb-19f9-1f450441ba5b
