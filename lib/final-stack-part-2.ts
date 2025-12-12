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

    // --- 1. S3 Bucket & Deployment (Static Content Server) ---
    const websiteBucket = new s3.Bucket(this, 'HtmlBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new s3deploy.BucketDeployment(this, 'HtmlDeploy', {
      // Assumes 'part2' is relative to the CDK file location (e.g., 'lib/part2')
      sources: [s3deploy.Source.asset(path.join(__dirname, 'part2'))],
      destinationBucket: websiteBucket,
      destinationKeyPrefix: 'web/',
    });

    // --- 2. Lambda Function to Read S3 ---
    const htmlServerLambda = new lambda.Function(this, 'HtmlServerLambda', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'handler.main',
      code: lambda.Code.fromAsset('lib/lambdas/part2'),
      environment: {
        BUCKET_NAME: websiteBucket.bucketName,
      },
    });

    // Grant Lambda Read permission to the S3 bucket
    websiteBucket.grantRead(htmlServerLambda);

    // --- 3. API Gateway (HTTP API) for Static Content ---
    const staticApi = new apigw.HttpApi(this, 'StaticHtmlApi', {
      apiName: 'StaticHtmlApi',
    });

    // Define the Lambda integration
    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      'HtmlServerIntegration',
      htmlServerLambda
    );

    // Set up the root path (GET /) for static content
    staticApi.addRoutes({
      path: '/',
      methods: [apigw.HttpMethod.GET],
      integration: lambdaIntegration
    });


    // =======================================================
    // --- NEW: Current Date API ---
    // =======================================================

    // 5. Define the Date Lambda Function (Inline Node.js for simplicity)
    const dateLambda = new lambda.Function(this, 'CurrentDateLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
                exports.handler = async (event) => {
                    const now = new Date();
                    return {
                        statusCode: 200,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                            currentDate: now.toLocaleDateString(),
                            currentTime: now.toLocaleTimeString(),
                            timestamp: now.toISOString()
                        }),
                    };
                };
            `),
    });

    // 6. Define API Gateway (NEW API) for the Date Endpoint
    const dateApi = new apigw.HttpApi(this, 'DateApi', {
      apiName: 'DateServiceApi',

      // ⬇️ ADD CORS CONFIGURATION HERE ⬇️
      corsPreflight: {
        // Allows the API to be called from ANY domain (*), including your S3 website URL.
        allowOrigins: ['*'],
        // Allow the standard GET method used by the fetch() call
        allowMethods: [apigw.CorsHttpMethod.GET],
        // Cache the CORS headers for 1 day
        maxAge: cdk.Duration.days(1),
      },
      // ⬆️ END CORS CONFIGURATION ⬆️
    });

    // 7. Define the Integration for the Date Lambda
    const dateIntegration = new integrations.HttpLambdaIntegration(
      'DateLambdaIntegration',
      dateLambda
    );

    // 8. Add a route: GET /date
    dateApi.addRoutes({
      path: '/date',
      methods: [apigw.HttpMethod.GET],
      integration: dateIntegration,
    });


    // --- 9. Outputs ---
    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: staticApi.url!,
      description: 'API Gateway Endpoint for the static HTML page (GET /).',
    });

    new cdk.CfnOutput(this, 'DateApiUrl', {
      value: dateApi.url! + 'date',
      description: 'API Gateway Endpoint to get the current date (GET /date).',
    });
  }
}