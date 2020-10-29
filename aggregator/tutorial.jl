### A Pluto.jl notebook ###
# v0.12.4

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

# ╔═╡ 5e865152-19f3-11eb-0434-7b4fe9bde74c
md"""
## Fetch some data via the open API

See [documentation](https://docs.mangrove.reviews), to try it out directly.
"""

# ╔═╡ e6055cee-19ea-11eb-0a18-dd5847a9b78b
all_data = Api.all_data();

# ╔═╡ 52f702b4-19f3-11eb-12db-bbf15e67ac47
md"## Define some useful filters"

# ╔═╡ 4f4d918e-19ec-11eb-3b85-53cdeccf6c6c
begin
	reviews = all_data[:reviews]
	issuers = all_data[:issuers]
	maresi_subjects = all_data[:maresi_subjects]
	payloads = [r[:payload] for r in reviews]
	ratings = [p[:rating]/25+1 for p in payloads if haskey(p, :rating)]
end;

# ╔═╡ 09950bc8-19f0-11eb-25cd-cbdad6720d00
md"We have **$(length(reviews))** reviews available, select one payload with the slider:"

# ╔═╡ 3a5fa0c4-19eb-11eb-0d57-8b3ae66cc2cb
@bind i Slider(1:length(payloads); show_value=true)

# ╔═╡ fd4eb326-19ea-11eb-064e-9765cb805381
payloads[i]

# ╔═╡ 623c0214-19f4-11eb-19f8-25bd8b4759c3
md"## View data in different ways"

# ╔═╡ b07ed06c-19f1-11eb-1e0d-f9cc921936f9
bar(countmap([r[:scheme] for r in reviews]); label="Number of reviews with given scheme")

# ╔═╡ afaa3110-19ef-11eb-1300-4f0997354a02
histogram(ratings; label="Number of reviews with given rating", legend=:left)

# ╔═╡ d88e9f14-19f2-11eb-25cb-515474ef1d7e
pie(countmap([haskey(p, :opinion) ? "Includes text" : "Only rating" for p in payloads]))

# ╔═╡ 0609d5fa-19f1-11eb-13d9-25c772bc2a10
[v[:neutrality] for v in values(issuers)] |> histogram

# ╔═╡ Cell order:
# ╠═2fcbf600-19e9-11eb-3f4e-812a4a557c20
# ╟─5e865152-19f3-11eb-0434-7b4fe9bde74c
# ╠═e6055cee-19ea-11eb-0a18-dd5847a9b78b
# ╟─52f702b4-19f3-11eb-12db-bbf15e67ac47
# ╠═4f4d918e-19ec-11eb-3b85-53cdeccf6c6c
# ╟─09950bc8-19f0-11eb-25cd-cbdad6720d00
# ╟─3a5fa0c4-19eb-11eb-0d57-8b3ae66cc2cb
# ╟─fd4eb326-19ea-11eb-064e-9765cb805381
# ╟─623c0214-19f4-11eb-19f8-25bd8b4759c3
# ╠═b07ed06c-19f1-11eb-1e0d-f9cc921936f9
# ╠═afaa3110-19ef-11eb-1300-4f0997354a02
# ╠═d88e9f14-19f2-11eb-25cb-515474ef1d7e
# ╠═0609d5fa-19f1-11eb-13d9-25c772bc2a10
