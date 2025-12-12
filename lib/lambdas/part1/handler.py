import os
import json
import boto3
import decimal

# Initialize the DynamoDB client outside the handler
DYNAMODB = boto3.resource('dynamodb')

TABLE_NAME = os.environ.get('TABLE_NAME')
VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

def main(event, context):
    """
    Handles API Gateway requests, validates path parameters, and queries DynamoDB.
    """
    
    # API Gateway V2 (HTTP API) sends path parameters in event['pathParameters']
    path_params = event.get('pathParameters', {})

    day_param = path_params.get('day')
    timeslot_param = path_params.get('timeslot')
    
    # 1. Input Validation (op1)
    op1 = day_param.lower() if day_param else None
    if not op1 or op1 not in VALID_DAYS:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': f"Invalid day (op1): {day_param}"})
        }
    
    # 2. Input Validation (op2)
    try:
        op2 = float(timeslot_param)
        # Check range (8-16) and half-hour increments (0.0 or 0.5)
        if not (8 <= op2 <= 16 and (op2 * 2) % 1 == 0):
             raise ValueError
    except (ValueError, TypeError):
        return {
            'statusCode': 404,
            'body': json.dumps({'error': f"Invalid timeslot (op2): {timeslot_param}. Must be 8-16 in 0.5 increments."})
        }

    try:
        # Use the DocumentClient for easier key lookup
        table = DYNAMODB.Table(TABLE_NAME)
        
        # 3. DynamoDB Lookup
        response = table.get_item(
            Key={
                'Day': op1,
                # DynamoDB needs the Timeslot number to be a Decimal type
                'Timeslot': decimal.Decimal(str(op2)) 
            }
        )
        
        # 4. Determine Response
        item = response.get('Item')
        
        course_response = '0' # Default: no class
        if item and 'Course' in item:
            course_response = item['Course']
        
        # 5. Return Success
        return {
            'statusCode': 200,
            'headers': { "Content-Type": "application/json" },
            'body': json.dumps({ 
                "day": op1,
                "timeslot": op2,
                "course": course_response 
            })
        }

    except Exception as e:
        print(f"DynamoDB Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal database error during lookup.'})
        }