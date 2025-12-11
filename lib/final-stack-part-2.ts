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

    // 1. Define the DynamoDB Table
    const itemsTable = new dynamodb.Table(this, 'ItemsTable', {
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY, 
    });

    // 2. Define the Python Lambda Function
    const itemsHandler = new lambda.Function(this, 'ItemsHandler', {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'handler.main',
        code: lambda.Code.fromAsset('lib/lambdas/part2'),
        environment: {
            ITEMS_TABLE_NAME: itemsTable.tableName, 
        },
    });

    // 3. Grant the Lambda Read/Write permissions
    itemsTable.grantReadWriteData(itemsHandler);

    // 4. Define the API Gateway (HTTP API)
    const httpApi = new apigw.HttpApi(this, 'DataApi', {
        apiName: 'Part2DataApi',
        
        // --- PERMISSIVE CORS CONFIGURATION FOR TESTING ---
        corsPreflight: {
            allowOrigins: ['*'], // Allows ANY origin (your S3 site, localhost, etc.)
            allowMethods: [apigw.CorsHttpMethod.GET, apigw.CorsHttpMethod.POST, apigw.CorsHttpMethod.OPTIONS],
            allowHeaders: ['*'], // Allows all headers
            maxAge: cdk.Duration.days(1),
        },
        // --- END PERMISSIVE CONFIGURATION ---
    });

    // 5. Define the Lambda Integration & Routes
    const lambdaIntegration = new integrations.HttpLambdaIntegration(
        'ItemsLambdaIntegration',
        itemsHandler
    );
    
    httpApi.addRoutes({ path: '/items', methods: [apigw.HttpMethod.POST], integration: lambdaIntegration });
    httpApi.addRoutes({ path: '/items/{id}', methods: [apigw.HttpMethod.GET], integration: lambdaIntegration });


    // --- S3 STATIC WEBSITE HOSTING ---

    // 6. Define the S3 Bucket for Static Website Hosting
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html', // <--- Enables S3 Static Hosting
      publicReadAccess: true,             // <--- Grants public read access
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      
      // We must explicitly configure blockPublicAccess to allow public policies
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
    });
    
    // 7. Deploy the Website Content to S3
    // Assumes 'website-assets' folder exists in your project root with index.html
    new s3deploy.BucketDeployment(this, 'WebsiteDeploy', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '..', 'website-assets'))],
      destinationBucket: websiteBucket,
    });

    // 8. Output the S3 Website URL
    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: websiteBucket.bucketWebsiteUrl, // <--- Use the S3 website endpoint URL
      description: 'The S3 Static Website URL.',
    });
    
    // 9. Output the API Gateway URL for use in the static website code
    new cdk.CfnOutput(this, 'ApiBaseUrl', {
        value: httpApi.url!,
        description: 'The base URL for the Part 2 API to be used in fetch calls.',
    });
  }
}