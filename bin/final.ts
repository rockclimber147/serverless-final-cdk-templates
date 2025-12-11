#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FinalStackPart1 } from '../lib/final-stack-part-1';
import { FinalStackPart2 } from '../lib/final-stack-part-2'; // <-- NEW

const app = new cdk.App();

// Stack 1: Simple API Gateway -> Lambda (Messaging)
new FinalStackPart1(app, 'FinalStackPart1', {
  // Use a fixed environment to ensure the deployment works smoothly
  // env: { account: '123456789012', region: 'us-east-1' },
});

// Stack 2: API Gateway -> Lambda -> DynamoDB (CRUD)
new FinalStackPart2(app, 'FinalStackPart2', { // <-- NEW
  // Use a fixed environment to ensure the deployment works smoothly
  // env: { account: '123456789012', region: 'us-east-1' },
});