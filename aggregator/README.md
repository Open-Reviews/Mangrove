# Mangrove Aggregator

This folder contains `Aggregator` [Julia](https://julialang.org/) module for generating statistics about Mangrove reviews.
This is what powers the subject [`quality`](https://docs.mangrove.reviews/#/paths/~1subject~1{sub}/get) and reviewer [`neutrality`](https://docs.mangrove.reviews/#/paths/~1issuer~1{pem}/get) fields in the API.

## Why is the Aggregator needed?

Mangrove makes it easy to write reviews pseudonymously and aims to preserve all reviews which are submitted. This means that some of the reviews may not be reflective of the actual quality of the subjects being reviewed. This is a common problem for proprietary review platforms and this is [one way to address it](https://mangrove.reviews/faq).

## How does it work?

Aggregator employs statistical methods to uncover what is the likely quality of subjects given all of the reviews, as well as how likely a given reviewer is to be neutral (fair) in their judgement.

To compute these statistics, the Aggregator takes in the list of all reviews as data and uses a [generative Bayesian model](src/Model.jl). The model is specified in a probabilistic programming language [Turing.jl](https://turing.ml/) and makes use of Bayesian inference to output the values of interest.

## How do the results make their way to Mangrove Server?

The Original Mangrove deployment uses [GitLab CI](../.gitlab-ci.yml) to run the Aggregator regularly and output the results in to PostgreSQL database tables (`subjects` and `reviewers`). The Mangrove Server then reads the values to provide them via the API.

## Try it out.

Get [Pluto.jl](https://github.com/fonsp/Pluto.jl) and check out the [notebook](tutorial.jl) to play around with the review data or the algorithm.
