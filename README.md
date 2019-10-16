# Mangrove

[Learn more about the project.](https://planting.space/mangrove.html)

This repository contains:
- [Mangrove Review Standard](Mangrove_Review_Standard_v1.md)
- Mangrove Original Server implementation
- Mangrove Original UI implementation

## Servers

Both servers need to be up for the UI to work.

Hash always refers to SHA256.

`npm` and Rust compiler is needed:
```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Nightly compiler version is used:
```
rustup default nightly
```

### Mangrove Review Server

Build the frontend:
```
cd reviewer/client
npm run build
cd ../..
```

Build and run the server.
```
cd reviewer
cargo run
```

- `PUT` a Mangrove Review as JSON to store it on the server.
- `GET` a list of Mangrove Reviews that have fields equal to query params.

### Mangrove File Server

```
cd file_hoster
cargo run
```

- `PUT` a file to `/upload` to store it on the server, get hash of the file if successful.
- `GET` a file with given hash from `/<hash>`.

#### Deploying to AWS Lambda
Deployment can be done using AWS CloudFormation using the [Serverless Application Model](https://docs.aws.amazon.com/lambda/latest/dg/serverless_app.html). The required CloudFormation template is already set up in [aws-template.yaml](aws-template.yaml).

Requirements:
- Docker
- [AWS CLI](https://aws.amazon.com/cli/)
- An existing S3 bucket

```sh
# Builds the lambda binary in a Docker container and outputs the packaged zip file
docker-compose run --rm build

S3_BUCKET=my-s3-bucket-name
# Choose any name you like for the CloudFormation stack
STACK_NAME=my-rocket-api

# Uploads the CloudFormation template and zipped binary to S3
aws cloudformation package --template-file aws-template.yaml --output-template-file packaged.yaml --s3-bucket $S3_BUCKET

# Deploys the CloudFormation stack
aws cloudformation deploy --template-file packaged.yaml --capabilities CAPABILITY_IAM --stack-name $STACK_NAME

# Outputs the API Gateway URL that you can use to call your API
aws cloudformation describe-stacks --query "Stacks[0].Outputs" --stack-name $STACK_NAME
```

