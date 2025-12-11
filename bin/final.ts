#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FinalStackPart1 as DaylenSmithStack1 } from '../lib/final-stack-part-1';
import { FinalStackPart2 as DaylenSmithStack2 } from '../lib/final-stack-part-2'; // <-- NEW

const app = new cdk.App();

// Stack 1: Simple API Gateway -> Lambda (Messaging)
new DaylenSmithStack1(app, 'DaylenSmithStack1', {
  // Use a fixed environment to ensure the deployment works smoothly
  // env: { account: '123456789012', region: 'us-west-1' },
});

// Stack 2: API Gateway -> Lambda -> DynamoDB (CRUD)
new DaylenSmithStack2(app, 'DaylenSmithStack2', { // <-- NEW
  // Use a fixed environment to ensure the deployment works smoothly
  // env: { account: '123456789012', region: 'us-east-1' },
});