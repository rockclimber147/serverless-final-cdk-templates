import os
import json
import boto3

# Initialize the S3 client outside of the main handler function for better performance (re-use)
S3 = boto3.client('s3')

# Environment variables are set by the CDK stack
BUCKET_NAME = os.environ.get('BUCKET_NAME')

# NOTE: The key is set by destinationKeyPrefix: 'web/' in the CDK
FILE_KEY = 'web/index.html'

def main(event, context):
    """
    AWS Lambda handler function to fetch HTML content from S3 and return it via API Gateway.
    """
    if not BUCKET_NAME:
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Configuration Error: BUCKET_NAME environment variable not set.'})
        }

    try:
        # 1. Fetch the HTML file content from S3
        response = S3.get_object(
            Bucket=BUCKET_NAME,
            Key=FILE_KEY
        )
        
        # 2. Read the content stream and decode it to a string
        html_content = response['Body'].read().decode('utf-8')
        
        # 3. Return the content with the correct MIME type (text/html)
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'text/html',
                # Set CORS header for broad compatibility
                'Access-Control-Allow-Origin': '*', 
            },
            'body': html_content,
        }
        
    except S3.exceptions.NoSuchKey:
        print(f"Error: File not found at s3://{BUCKET_NAME}/{FILE_KEY}")
        return {
            'statusCode': 404,
            'body': json.dumps({'message': 'HTML file not found in S3.'})
        }
        
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal Server Error during file retrieval.'})
        }