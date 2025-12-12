import os
import json
import boto3
import decimal

# Initialize the DynamoDB client outside the handler
DYNAMODB = boto3.resource('dynamodb')

TABLE_NAME = os.environ.get('TABLE_NAME')
VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

def main(event, context):
    path_params = event.get('pathParameters', {})

    day_param = path_params.get('day')
    timeslot_param = path_params.get('timeslot')

    op1 = day_param.lower() if day_param else None
    if not op1 or op1 not in VALID_DAYS:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': f"404"})
        }
    try:
        op2 = float(timeslot_param)
        if not (8.0 <= op2 <= 16.0):
            raise ValueError
            
        if (op2 * 2) % 1 != 0:
            raise ValueError

    except (ValueError, TypeError):
        return {
            'statusCode': 404,
            'body': json.dumps({'error': f"404"})
        }

    try:
        table = DYNAMODB.Table(TABLE_NAME)
        
        response = table.get_item(
            Key={
                'Day': op1,
                'Timeslot': decimal.Decimal(str(op2)) 
            }
        )
        
        item = response.get('Item')
        
        course_response = '0'
        if item and 'Course' in item:
            course_response = item['Course']
        
        return {
            'statusCode': 200,
            'headers': { "Content-Type": "application/json" },
            'body': json.dumps({ 
                "course": course_response 
            })
        }

    except Exception as e:
        print(f"DynamoDB Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal database error during lookup.'})
        }