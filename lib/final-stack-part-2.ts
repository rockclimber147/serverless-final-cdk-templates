import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
// NEW IMPORTS FOR STATIC WEBSITE
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as path from 'path';


export class FinalStackPart2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- 1. S3 Bucket & Deployment ---
    const websiteBucket = new s3.Bucket(this, 'HtmlBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, 'HtmlDeploy', {
      // Corrected Path: Go up one level (..) to 'root/lib/', then into 'part2'
      sources: [s3deploy.Source.asset(path.join(__dirname, 'part2'))],
      destinationBucket: websiteBucket,
      destinationKeyPrefix: 'web/',
    });

    // --- 2. Lambda Function to Read S3 ---
    const htmlServerLambda = new lambda.Function(this, 'HtmlServerLambda', {
      // ⬇️ CHANGE: Use Python Runtime ⬇️
      runtime: lambda.Runtime.PYTHON_3_12,
      // ⬇️ CHANGE: Use handler.main (assuming file is handler.py) ⬇️
      handler: 'handler.main',
      // CHANGE: Code path must point to where your Python file is located (e.g., 'lib/lambdas/part2')
      code: lambda.Code.fromAsset('lib/lambdas/part2'),
      environment: {
        BUCKET_NAME: websiteBucket.bucketName,
      },
    });

    // Grant Lambda Read permission to the S3 bucket
    websiteBucket.grantRead(htmlServerLambda);

    // --- 3. API Gateway (HTTP API) ---
    const httpApi = new apigw.HttpApi(this, 'StaticHtmlApi', {
      apiName: 'StaticHtmlApi',
    });

    // Define the Lambda integration
    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      'HtmlServerIntegration',
      htmlServerLambda
    );

    // Set up the root path (GET /) to trigger the Lambda
    httpApi.addRoutes({
      path: '/',
      methods: [apigw.HttpMethod.GET],
      integration: lambdaIntegration
    });

    // --- 4. Outputs ---
    new cdk.CfnOutput(this, 'WebPageUrl', {
      value: httpApi.url!,
      description: 'API Gateway Endpoint to view the static page.',
    });
  }
}