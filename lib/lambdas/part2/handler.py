import json
import os
import boto3
from uuid import uuid4
from decimal import Decimal # <--- 1. Import Decimal

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('ITEMS_TABLE_NAME')
table = dynamodb.Table(table_name)

# --- NEW: Custom JSON Encoder Function ---
def decimal_default_encoder(obj):
    """Encodes Decimal objects as float for JSON serialization."""
    if isinstance(obj, Decimal):
        # Check if the number has no fractional part (is an integer)
        if obj % 1 == 0:
            return int(obj)
        else:
            return float(obj)
    # Revert to default behavior if the object type is not Decimal
    raise TypeError(f'Object of type {obj.__class__.__name__} is not JSON serializable')
# --- END NEW FUNCTION ---


def main(event, context):
    """
    Main handler for the API Gateway integration.
    Handles POST for creation and GET for reading.
    """
    
    method = event['requestContext']['http']['method']
    path = event['requestContext']['http']['path']
    
    # --- CREATE Operation: POST /items ---
    if method == 'POST' and path == '/items':
        try:
            item_data = json.loads(event['body'])
            
            # Use UUID for a guaranteed unique primary key
            item_id = str(uuid4())
            item_data['id'] = item_id

            table.put_item(Item=item_data)

            # NOTE: json.dumps does not need the encoder here as we are only returning
            # the ID and a message, not the full DynamoDB item object.
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'Item created successfully', 'id': item_id, 'item': item_data}),
            }
        except Exception as e:
            print(f"Error during POST: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps({'message': 'Failed to create item', 'error': str(e)}),
            }

    # --- READ Operation: GET /items/{id} ---
    elif method == 'GET' and path.startswith('/items/'):
        try:
            item_id = event['pathParameters']['id']
            
            response = table.get_item(Key={'id': item_id})
            item = response.get('Item')

            if item:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    # <--- 2. Pass the custom encoder to json.dumps() for the item --->
                    'body': json.dumps(item, default=decimal_default_encoder), 
                }
            else:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'message': f'Item with ID {item_id} not found'}),
                }
        except Exception as e:
            print(f"Error during GET: {e}")
            return {
                'statusCode': 500,
                'body': json.dumps({'message': 'Failed to read item', 'error': str(e)}),
            }

    # --- Unhandled Route ---
    return {
        'statusCode': 400,
        'body': json.dumps({'message': f'Unsupported method/path: {method} {path}'}),
    }