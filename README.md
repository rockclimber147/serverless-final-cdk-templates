# Welcome to your CDK TypeScript Project (Final Project)

This project contains two AWS CDK stacks defining a serverless backend infrastructure using TypeScript, Python Lambdas, API Gateway, and DynamoDB.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## 🛠️ Project Setup and Prerequisites

Before running this project, you need the following tools installed and configured:

1.  **Node.js (LTS)**: Required for the CDK CLI and managing project dependencies.
2.  **AWS CDK CLI**: Global installation (`npm install -g aws-cdk`).
3.  **Python 3.x**: Required for the Lambda runtime and local development.
4.  **AWS CLI**: Required for initial account setup and configuration.

### 1. Configure AWS Credentials

You must configure your AWS account credentials locally so the CDK can authenticate and deploy resources.

```bash
# Install AWS CLI if you haven't already
# pip install awscli

# Configure your access keys and default region
aws configure
```

> **Note:** The `aws configure` command will prompt you for your `AWS Access Key ID`, `AWS Secret Access Key`, default region (e.g., `us-west-2`), and output format.

### 2. Install Project Dependencies

Run these commands from the root directory of your project:

```bash
# Install Node.js dependencies (TypeScript, CDK library)
npm install

# Install Python dependencies for the Lambdas (e.g., Boto3 in the Part 2 folder)
# This step assumes your Lambda code lives in the specific subdirectories:
cd lib/lambdas/part2
npm install
cd ../../../
```

### 3. AWS CDK Bootstrap (Initial Setup)

The first time you deploy to a new AWS account/region, you must _bootstrap_ it. This creates the necessary S3 bucket and IAM roles the CDK uses for deployment.

```bash
# Get your account ID and region from your configuration or environment variables
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query "Account" --output text)
export CDK_DEFAULT_REGION=$(aws configure get region)

# Run the bootstrap command
npx cdk bootstrap aws://${CDK_DEFAULT_ACCOUNT}/${CDK_DEFAULT_REGION}
```

## 🚀 Running and Deploying

The project contains two stacks:

- **FinalStackPart1**: Simple API Gateway + Lambda for a message response.
- **FinalStackPart2**: API Gateway + Python Lambda + DynamoDB for basic CRUD operations.

### Useful commands

- `npm run build` ``` compile typescript to JavaScript
- `npm run watch` ``` watch for changes and compile
- `npm run test` ``` perform the jest unit tests
- `npx cdk synth` ``` emits the synthesized CloudFormation template for inspection
- `npx cdk diff` ``` compare deployed stack(s) with current state

### Deploying the Stacks

To deploy both stacks and all defined resources:

```bash
# Compare the local changes against the deployed environment (optional, but recommended)
npx cdk diff FinalStackPart1 FinalStackPart2

# Deploy both stacks simultaneously
npx cdk deploy FinalStackPart1 FinalStackPart2
```

> **Note:** CDK will prompt you for approval before deploying, especially if IAM security changes are involved.

### Testing the Endpoints

After deployment, the API Gateway URLs will be printed in the console output. Use them to test your endpoints (e.g., with `curl` or PowerShell's `Invoke-RestMethod`):

- **Part 1 Test (GET):** `[Part1-URL]/hello`
- **Part 2 Test (POST):** `[Part2-URL]/items` with a JSON body
- **Part 2 Test (GET):** `[Part2-URL]/items/{id}`

## 🗑️ Destroying Resources

When you are finished, you must destroy the stacks to avoid incurring AWS charges.

```bash
# Destroy both stacks and all their resources
npx cdk destroy FinalStackPart1 FinalStackPart2
```

> **Warning:** This command permanently deletes all resources (API Gateways, Lambdas, DynamoDB tables, etc.) within these stacks.
