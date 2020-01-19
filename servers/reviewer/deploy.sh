#!/bin/bash

S3_BUCKET=mangrove-lambda
# Choose any name you like for the CloudFormation stack
STACK_NAME=review-server

#docker-machine start default

# Builds the lambda binary in a Docker container and outputs the packaged zip file
docker-compose run --rm build

# Uploads the CloudFormation template and zipped binary to S3
aws2 cloudformation package --template-file template.yaml --output-template-file packaged.yaml --s3-bucket $S3_BUCKET

# Deploys the CloudFormation stack
aws2 cloudformation deploy --template-file packaged.yaml --capabilities CAPABILITY_IAM --stack-name $STACK_NAME

# Outputs the API Gateway URL that you can use to call your API
aws2 cloudformation describe-stacks --query "Stacks[0].Outputs" --stack-name $STACK_NAME
