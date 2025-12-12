import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class FinalStackPart1 extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Define the DynamoDB Table
    const scheduleTable = new dynamodb.Table(this, 'ScheduleTable', {
      partitionKey: { name: 'Day', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'Timeslot', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 2. Define the Lambda Function (Python)
    const schedulingLambda = new lambda.Function(this, 'SchedulingLambda', {
      runtime: lambda.Runtime.PYTHON_3_12, // <-- PYTHON Runtime
      handler: 'handler.main',            // <-- handler.py and main function
      code: lambda.Code.fromAsset('lib/lambdas/part1'), // <-- Corrected Path
      environment: {
        TABLE_NAME: scheduleTable.tableName,
      },
    });

    // 3. Grant the Lambda Read permission
    scheduleTable.grantReadData(schedulingLambda);

    // 4. Define the API Gateway (HTTP API)
    const httpApi = new apigw.HttpApi(this, 'ScheduleApi', {
      apiName: 'SchedulingToolApi',
    });

    // 5. Define the Integration and Route
    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      'SchedulingIntegration',
      schedulingLambda
    );

    // Route with Path Parameters: /op1/op2 format
    httpApi.addRoutes({
      path: '/{day}/{timeslot}',
      methods: [apigw.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    new cdk.CfnOutput(this, 'ScheduleApiUrl', {
      value: httpApi.url!,
      description: 'The URL endpoint (Append /mon/8 to test).',
    });
  }
}