#!/bin/bash

docker-machine start default
docker-compose run --rm build
sam local start-api
