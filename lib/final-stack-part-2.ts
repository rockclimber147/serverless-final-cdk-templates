import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class FinalStackPart2 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const itemsTable = new dynamodb.Table(this, 'ItemsTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
    });

    const itemsHandler = new lambda.Function(this, 'ItemsHandler', {
      runtime: lambda.Runtime.PYTHON_3_12, // <--- Using Python Runtime
      handler: 'handler.main',             // <--- Points to handler.py, function 'main'
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
    });

    // 5. Define the Lambda Integration
    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      'ItemsLambdaIntegration',
      itemsHandler
    );

    // 6. Add Routes
    httpApi.addRoutes({
      path: '/items',          
      methods: [apigw.HttpMethod.POST],
      integration: lambdaIntegration,
    });
    
    httpApi.addRoutes({
      path: '/items/{id}',     
      methods: [apigw.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    // 7. Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiUrlPart2', {
      value: httpApi.url!,
      description: 'The base URL for the Part 2 API.',
    });
  }
}